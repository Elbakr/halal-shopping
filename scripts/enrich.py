"""Fills missing street names and postcodes of halal.shopping places from open sources, never guessing.

Called by places.py on the compact places (before tiling). Each source runs on its own: if one fails or runs out of
time, the places are published without its values. A value that OpenStreetMap already gives for the venue itself is
never replaced.

PROVENANCE, stored in each place as  "s": {field: code}
  fields   a   street, EXACT (the street is certain; the house number is NOT added, see below)
           ap  street, APPROACHED: nearest named street, may be wrong, always shown with "≈"
           z   postcode
  codes    ob    OpenStreetMap building containing the venue, carrying addr:street (no other street within 10 m)
           on    OpenStreetMap address object (addr:street + addr:housenumber) within 10 m, no other street within 20 m
           oa    postcode shared by every OpenStreetMap address object within 20 m
           best  BeST Address, official Belgian address register (point within 10 m, no other street within 15 m;
                 postcode: every register point within 30 m agrees)
           ban   Base Adresse Nationale, official French register (house number point within 10 m whose street is also
                 the nearest OpenStreetMap street; postcode: point within 50 m)
           or    nearest named OpenStreetMap street within 30 m (field ap only)
  Example: {"i":"n1","n":"...","a":"Rue de Brabant","s":{"a":"ob","z":"ob"}}

QUALITY (python3 scripts/enrich.py --qc): every rule is replayed on places that already have their own street in
OpenStreetMap, as if it were missing. A source is "exact" only if its street agrees in more than 95 % of cases.
Agreement varies by country, so "exact" applies only in EXACT_CC (below); elsewhere the street is "approached".
House numbers agreed in only 30-77 % of cases for every source (a shop is rarely at the building's main number), so
no house number is ever added. Overture Maps Places was measured too (phones 84-88 %, websites 70-72 %, streets
64-82 % agreement) and is not used.

Licences: OpenStreetMap ODbL; BeST Address CC BY 4.0 (BOSA); Base Adresse Nationale Licence Ouverte 2.0 (Etalab)."""
import csv, io, json, math, os, re, sys, tempfile, time, unicodedata, urllib.parse, urllib.request, zipfile, collections

UA = {"User-Agent": "halal.shopping/1.0 (places builder)"}
QLEVER = "https://qlever.dev/api/osm-planet"
BAN_CSV = "https://api-adresse.data.gouv.fr/reverse/csv/"
BEST_ZIPS = ["https://opendata.bosa.be/download/best/openaddress-bebru.zip",
             "https://opendata.bosa.be/download/best/openaddress-bevlg.zip",
             "https://opendata.bosa.be/download/best/openaddress-bewal.zip"]
FR_CC = {"FR", "RE", "GP", "MQ", "GF", "YT", "PM", "BL", "MF"}
PFX = ("PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:> PREFIX geo: <http://www.opengis.net/ont/geosparql#> "
       "PREFIX ogc: <http://www.opengis.net/rdf#> PREFIX qlss: <https://qlever.cs.uni-freiburg.de/spatialSearch/> ")
ROADS = ("residential", "primary", "secondary", "tertiary", "unclassified", "living_street", "pedestrian", "trunk",
         "primary_link", "secondary_link", "tertiary_link", "road")

# ---------- street-name comparison (tolerant to accents, articles, punctuation and common abbreviations only) ----------
ABBR = {"av": "avenue", "ave": "avenue", "bd": "boulevard", "bld": "boulevard", "blvd": "boulevard", "boul": "boulevard",
        "pl": "place", "rte": "route", "chee": "chaussee", "ch": "chemin", "imp": "impasse", "all": "allee", "sq": "square",
        "gen": "general", "gal": "general", "pdt": "president", "pres": "president", "dr": "docteur", "doct": "docteur",
        "mal": "marechal", "st": "saint", "ste": "sainte", "str": "strasse", "cad": "caddesi", "cd": "caddesi",
        "sk": "sokagi", "sok": "sokagi", "sokak": "sokagi", "bulv": "bulvari", "rd": "road", "ln": "lane",
        "mah": "mahallesi", "ul": "ulica", "al": "aleja", "os": "osiedle"}
STOP = {"de", "du", "des", "la", "le", "les", "l", "d", "der", "die", "das", "den", "van", "het", "of", "the", "di", "del",
        "della", "dei", "da", "do", "dos", "y", "e", "et", "und", "en", "a", "au", "aux"}

def toks(s):
    s = unicodedata.normalize("NFKD", (s or "").lower().replace("ß", "ss"))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"strasse\b", " strasse", s)
    t = [w for w in re.split(r"[^0-9a-zЀ-ӿ؀-ۿ฀-๿぀-鿿]+", s) if w]
    return [ABBR.get(w, w) for w in t if w not in STOP]

def same_street(a, b):
    ta, tb = toks(a), toks(b)
    if not ta or not tb: return False
    if ta == tb or "".join(ta) == "".join(tb): return True
    short, long_ = (ta, tb) if len(ta) <= len(tb) else (tb, ta)
    if len(short) >= 2 and short[0] == long_[0] and short[-1] == long_[-1]:  # a middle first name left out
        it = iter(long_); return all(w in it for w in short)
    return False

def key(s): return "".join(toks(s))

# ---------- sources ----------
def lit(v):
    v = v.strip()
    if v.startswith('"'): v = v[1:v.rfind('"')].replace('\\"', '"').replace("\\\\", "\\")
    return v

def oid(v):
    m = re.match(r"<https://www\.openstreetmap\.org/(node|way|relation)/(\d+)>", v.strip())
    return m.group(1)[0] + m.group(2) if m else None

def iri(i): return "<https://www.openstreetmap.org/%s/%s>" % ({"n": "node", "w": "way", "r": "relation"}[i[0]], i[1:])

def qlever(q, timeout=900):
    req = urllib.request.Request(QLEVER, data=urllib.parse.urlencode({"query": PFX + q}).encode(),
                                 headers=dict(UA, Accept="text/tab-separated-values"))
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8").split("\n")[1:]

def countries():
    rows = qlever('SELECT ?r ?iso WHERE { ?r osmkey:ISO3166-1 ?iso ; osmkey:boundary "administrative" ; osmkey:admin_level ?l . FILTER(STR(?l)="2") }', 300)
    out = {}
    for r in rows:
        c = r.split("\t")
        if len(c) > 1: out.setdefault(lit(c[1]), c[0].strip())
    return out

def osm_join(places, deadline, last=None):
    """Per country, OpenStreetMap address objects within 40 m and named streets within 80 m of each venue (QLever spatial join)."""
    adr, st = collections.defaultdict(list), collections.defaultdict(list)
    rel = countries()
    by = collections.defaultdict(list)
    for p in places:
        if p.get("cc") in rel: by[p["cc"]].append(p["i"])
    done, ok_cc, last = 0, set(), last or {}
    for cc in sorted(by, key=lambda c: (last.get(c, 0), -len(by[c]))):  # least recently refreshed countries first
        failed = False
        vals = " ".join(iri(i) for i in by[cc])
        for kind in ("adr", "str"):
            if time.time() > deadline: print("enrich: OSM time budget reached,", done, "countries done", flush=True); return adr, st, ok_cc
            if kind == "adr":
                right = ("{ %s ogc:sfContains ?a . ?a osmkey:addr:housenumber ?hn ; osmkey:addr:street ?st ; geo:hasGeometry/geo:asWKT ?ag . "
                         "OPTIONAL { ?a osmkey:addr:postcode ?pc } OPTIONAL { ?a osmkey:building ?bd } }" % rel[cc])
                sel, md = "?s ?a ?st ?pc ?bd ?d", 40
            else:
                right = ("{ ?a ogc:sfIntersects %s . ?a osmkey:highway ?hw ; osmkey:name ?st ; geo:hasGeometry/geo:asWKT ?ag . FILTER(?hw IN (%s)) }"
                         % (rel[cc], ",".join('"%s"' % r for r in ROADS)))
                sel, md = "?s ?a ?st ?d", 80
            q = ("SELECT %s WHERE { VALUES ?s { %s } ?s geo:hasGeometry/geo:asWKT ?sg . SERVICE qlss: { _:c qlss:algorithm qlss:libspatialjoin ; "
                 "qlss:left ?sg ; qlss:right ?ag ; qlss:joinType qlss:within-dist ; qlss:maxDistance %d ; qlss:bindDistance ?d ; qlss:payload qlss:all . %s } }"
                 % (sel, vals, md, right))
            for attempt in range(2):
                try:
                    rows = qlever(q); break
                except Exception as e:
                    print("enrich: OSM", cc, kind, "failed:", e, flush=True); rows = None; time.sleep(10)
            failed = failed or rows is None
            for r in rows or []:
                c = r.split("\t")
                if kind == "adr" and len(c) >= 6:
                    s, a = oid(c[0]), oid(c[1])
                    if s and a and s != a:
                        try: adr[s].append({"a": a, "st": lit(c[2]), "pc": lit(c[3]), "bd": bool(c[4].strip()), "d": float(lit(c[5]))})
                        except ValueError: pass
                elif kind == "str" and len(c) >= 4:
                    s = oid(c[0])
                    try: st[s].append({"st": lit(c[2]), "d": float(lit(c[3]))})
                    except ValueError: pass
        done += 1
        if not failed: ok_cc.add(cc)
    print("enrich: OSM", done, "countries,", len(adr), "venues with address objects,", len(st), "with streets", flush=True)
    return adr, st, ok_cc

def ban(places):
    """Base Adresse Nationale reverse geocoding by CSV batch (the endpoint made for bulk use)."""
    out, fr = {}, [p for p in places if p.get("cc") in FR_CC]
    for k in range(0, len(fr), 4000):
        body = "id,lat,lon\n" + "".join("%s,%s,%s\n" % (p["i"], p["la"], p["lo"]) for p in fr[k:k + 4000])
        b = "----halalshopping%d" % k
        data = ("--%s\r\nContent-Disposition: form-data; name=\"data\"; filename=\"p.csv\"\r\nContent-Type: text/csv\r\n\r\n%s\r\n--%s--\r\n" % (b, body, b)).encode()
        req = urllib.request.Request(BAN_CSV, data=data, headers=dict(UA, **{"Content-Type": "multipart/form-data; boundary=" + b}))
        for attempt in range(4):
            try: text = urllib.request.urlopen(req, timeout=600).read().decode("utf-8"); break
            except Exception as e:
                if attempt == 3: raise
                print("enrich: BAN retry:", e, flush=True); time.sleep(20)
        for r in csv.DictReader(io.StringIO(text)):
            if r.get("result_type") == "housenumber" and r.get("result_distance"):
                out[r["id"]] = {"st": r.get("result_street") or "", "pc": r.get("result_postcode") or "", "d": float(r["result_distance"])}
    print("enrich: BAN", len(out), "of", len(fr), "French venues", flush=True)
    return out

def best(places):
    """BeST Address points within 30 m of Belgian venues (official register, full download)."""
    be = [p for p in places if p.get("cc") == "BE"]
    if not be: return {}
    cells = collections.defaultdict(list)
    for p in be:
        cy, cx = math.floor(p["la"] * 1000), math.floor(p["lo"] * 1000)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1): cells[(cy + dy, cx + dx)].append(p)
    out = collections.defaultdict(list)
    for url in BEST_ZIPS:
        with tempfile.TemporaryFile() as f:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=900) as r:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            f.seek(0)
            z = zipfile.ZipFile(f)
            for name in z.namelist():
                if not name.endswith(".csv"): continue
                for row in csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8")):
                    if row.get("status") != "current": continue
                    try: la, lo = float(row["EPSG:4326_lat"]), float(row["EPSG:4326_lon"])
                    except (ValueError, KeyError): continue
                    for p in cells.get((math.floor(la * 1000), math.floor(lo * 1000)), ()):
                        d = dist(p["la"], p["lo"], la, lo)
                        if d <= 30:
                            names = [x for x in (row.get("streetname_fr"), row.get("streetname_nl"), row.get("streetname_de")) if x]
                            if names: out[p["i"]].append({"names": names, "pc": row.get("postcode") or "", "d": d})
    print("enrich: BeST", len(out), "of", len(be), "Belgian venues", flush=True)
    return out

def dist(la1, lo1, la2, lo2):
    r = math.radians
    h = math.sin(r(la2 - la1) / 2) ** 2 + math.cos(r(la1)) * math.cos(r(la2)) * math.sin(r(lo2 - lo1) / 2) ** 2
    return 12742000 * math.asin(math.sqrt(h))

# ---------- decision rules (the ones measured by --qc) ----------
def r_best(c):
    near = [x for x in c if x["d"] <= 10]
    if not near: return None
    b = min(near, key=lambda x: x["d"])
    if any({key(n) for n in x["names"]} != {key(n) for n in b["names"]} for x in c if x["d"] <= 15): return None
    return " - ".join(dict.fromkeys(b["names"][:2])) if len(b["names"]) > 1 and key(b["names"][0]) != key(b["names"][1]) else b["names"][0]

def r_ob(c):
    inside = [x for x in c if x["bd"] and x["d"] == 0 and x["a"][0] in "wr"]
    if not inside or len({key(x["st"]) for x in inside}) > 1: return None
    if any(key(x["st"]) != key(inside[0]["st"]) for x in c if x["d"] <= 10): return None
    return inside[0]

def r_on(c):
    near = [x for x in c if x["d"] <= 10 and not (x["bd"] and x["d"] == 0)]
    if not near: return None
    b = min(near, key=lambda x: x["d"])
    if any(key(x["st"]) != key(b["st"]) for x in c if x["d"] <= 20): return None
    return b

def nearest_street(c, maxd=30):
    c = [x for x in c if x["d"] <= maxd]
    return min(c, key=lambda x: x["d"])["st"] if c else None

def r_ban(b, streets):
    if not b or b["d"] > 10 or not b["st"]: return None
    ns = nearest_street(streets)
    return b["st"] if ns and same_street(b["st"], ns) else None

def street_rules(i, ADR, ST, BAN, BEST):
    """Exact street candidates in order of measured reliability: [(code, street)]."""
    out = []
    if i in BEST:
        s = r_best(BEST[i])
        if s: out.append(("best", s))
    if i in ADR:
        b = r_ob(ADR[i])
        if b: out.append(("ob", b["st"]))
        n = r_on(ADR[i])
        if n: out.append(("on", n["st"]))
    s = r_ban(BAN.get(i), ST.get(i, []))
    if s: out.append(("ban", s))
    return out

def postcode_rules(i, ADR, BAN, BEST):
    out = []
    c = [x for x in BEST.get(i, []) if x["pc"]]
    if c and len({x["pc"] for x in c}) == 1: out.append(("best", c[0]["pc"]))
    c = [x for x in ADR.get(i, []) if x["d"] <= 20 and x["pc"]]
    if c and len({x["pc"].replace(" ", "").upper() for x in c}) == 1: out.append(("oa", c[0]["pc"]))
    b = BAN.get(i)
    if b and b["d"] <= 50 and b["pc"]: out.append(("ban", b["pc"]))
    return out

# Countries where the combined exact-street rule agreed with OpenStreetMap's own streets in more than 95 % of at least
# 100 test venues (measure of 2026-11-10, python3 scripts/enrich.py --qc). Elsewhere the same street is only "approached".
EXACT_CC = {"DE", "NL", "BE", "CZ", "NZ", "PL", "CA", "IT", "GB", "CH", "BY", "FR", "AU", "AT"}

def has_street(a): return bool(a and re.search(r"[^\W\d_]{2}", a))

def apply(places, ADR, ST, BAN, BEST):
    n = collections.Counter()
    for p in places:
        i, s = p["i"], {}
        if not has_street(p.get("a")):
            cands = street_rules(i, ADR, ST, BAN, BEST)
            agree = bool(cands) and all(same_street(cands[0][1], x[1]) for x in cands)
            if agree and p.get("cc") in EXACT_CC:
                code, street = cands[0]
                p["a"] = (street + " " + p["a"]) if p.get("a") else street  # a lone house number from OSM is kept
                s["a"] = code
            elif agree:  # same rule, but not reliable enough in this country: approached only
                p["ap"] = cands[0][1][:80]; s["ap"] = cands[0][0]
            else:
                ap = nearest_street(ST.get(i, []))
                if ap: p["ap"] = ap[:80]; s["ap"] = "or"
            if "a" in p: p["a"] = p["a"][:80]
        if not p.get("z"):
            z = postcode_rules(i, ADR, BAN, BEST)
            if z and len({x[1].replace(" ", "").upper() for x in z}) == 1:
                p["z"] = z[0][1][:12]; s["z"] = z[0][0]
        if s:
            p["s"] = s
            for k, v in s.items(): n[k + ":" + v] += 1
    return n

CACHE = "data/enrich_cache.json"  # last values per venue, reused for countries the OSM join could not refresh tonight

def enrich(places, budget=2400, cache_path=CACHE):
    """Adds what the sources give, in place. Never raises: a failing source is skipped."""
    t0 = time.time()
    try: cache = json.load(open(cache_path, encoding="utf-8"))
    except Exception: cache = {"done": {}, "v": {}}
    need = [p for p in places if not has_street(p.get("a")) or not p.get("z")]
    ADR, ST, BAN, BEST, ok_cc = {}, {}, {}, {}, set()
    try: ADR, ST, ok_cc = osm_join(need, t0 + budget, cache.get("done"))
    except Exception as e: print("enrich: OSM join unavailable:", e, flush=True)
    try: BAN = ban(need)
    except Exception as e: print("enrich: BAN unavailable:", e, flush=True)
    try: BEST = best(need)
    except Exception as e: print("enrich: BeST unavailable:", e, flush=True)
    n = apply(places, ADR, ST, BAN, BEST)
    reused = 0
    for p in places:  # countries not refreshed tonight keep last night's values, if the venue has not moved
        c = cache.get("v", {}).get(p["i"])
        if p.get("cc") in ok_cc or not c or abs(c["la"] - p["la"]) > 1e-4 or abs(c["lo"] - p["lo"]) > 1e-4: continue
        s = p.get("s", {})
        if "a" in c and not has_street(p.get("a")): p["a"] = c["a"]; s["a"] = c["s"]["a"]; s.pop("ap", None); p.pop("ap", None)
        elif "ap" in c and not has_street(p.get("a")) and "ap" not in p: p["ap"] = c["ap"]; s["ap"] = c["s"]["ap"]
        if "z" in c and not p.get("z"): p["z"] = c["z"]; s["z"] = c["s"]["z"]
        if s: p["s"] = s; reused += 1
    now = int(time.time())
    done = {k: v for k, v in cache.get("done", {}).items()}
    done.update({cc: now for cc in ok_cc})
    v = {p["i"]: dict({k: p[k] for k in ("a", "ap", "z") if k in p and k in p["s"]}, la=p["la"], lo=p["lo"], s=p["s"]) for p in places if p.get("s")}
    try:
        tmp = cache_path + ".tmp"
        json.dump({"done": done, "v": v}, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        os.replace(tmp, cache_path)
    except Exception as e: print("enrich: cache not written:", e, flush=True)
    print("enrich: reused from cache", reused, flush=True)
    print("enrich: added", dict(sorted(n.items())), "in", round(time.time() - t0), "s", flush=True)
    return n

# ---------- quality control ----------
def qc(places, ADR, ST, BAN, BEST):
    """Replays every rule on places that have their own street (and postcode) in OpenStreetMap. Returns the measures."""
    def own(a):
        w = a.split(); sts = [a]
        if len(w) > 1 and w[-1][0].isdigit(): sts.append(" ".join(w[:-1]))
        if len(w) > 2 and w[-2][0].isdigit(): sts.append(" ".join(w[:-2]))
        return sts + [x for y in list(sts) for x in re.split(r" - | / ", y)]
    def agree(cand, a): return any(same_street(c, x) for c in re.split(r" - ", cand) + [cand] for x in own(a))
    m = collections.defaultdict(lambda: [0, 0])
    for p in places:
        i = p["i"]
        if has_street(p.get("a")) and len(re.findall(r"[^\W\d_]", p["a"])) >= 3:
            cands = street_rules(i, ADR, ST, BAN, BEST)
            for code, s in cands:
                m["a:" + code][0] += 1; m["a:" + code][1] += agree(s, p["a"])
            if cands and all(same_street(cands[0][1], x[1]) for x in cands):
                k = "a:FINAL" if p.get("cc") in EXACT_CC else "ap:" + cands[0][0]
                m[k][0] += 1; m[k][1] += agree(cands[0][1], p["a"])
                if p.get("cc") not in EXACT_CC: m["ap:ALL"][0] += 1; m["ap:ALL"][1] += agree(cands[0][1], p["a"])
            elif ST.get(i):
                ap = nearest_street(ST[i])
                if ap:
                    m["ap:or"][0] += 1; m["ap:or"][1] += agree(ap, p["a"])
                    m["ap:ALL"][0] += 1; m["ap:ALL"][1] += agree(ap, p["a"])
        if p.get("z"):
            for code, z in postcode_rules(i, ADR, BAN, BEST):
                m["z:" + code][0] += 1; m["z:" + code][1] += z.replace(" ", "").upper() == p["z"].replace(" ", "").upper()
    return {k: (v[0], round(100.0 * v[1] / v[0], 1) if v[0] else None) for k, v in sorted(m.items())}

if __name__ == "__main__" and "--qc" in sys.argv:
    import glob
    P = []
    for f in glob.glob("data/places/*_*.json"): P += json.load(open(f, encoding="utf-8"))
    t0, cache = time.time(), os.environ.get("ENRICH_CACHE")  # local testing only: keeps the raw candidates
    if cache and os.path.exists(cache):
        import pickle; ADR, ST, BAN, BEST = pickle.load(open(cache, "rb"))
    else:
        import pickle
        ADR, ST, _ = osm_join(P, t0 + 7200)
        if cache: pickle.dump((dict(ADR), dict(ST), {}, {}), open(cache, "wb"))
        BAN, BEST = ban(P), best(P)
        if cache: pickle.dump((dict(ADR), dict(ST), BAN, dict(BEST)), open(cache, "wb"))
    res = qc(P, ADR, ST, BAN, BEST)
    for k, v in res.items(): print("%-10s n=%-6d concordance=%s%%" % (k, v[0], v[1]))
    json.dump(res, open(os.environ.get("QC_OUT", "/dev/null"), "w"), indent=1)
