"""Halal-declared shops and restaurants from OpenStreetMap, cut into 1-degree tiles the site loads instantly.
Only what OpenStreetMap contributors declared (diet:halal / halal / butcher=halal). Nothing is invented."""
import json, math, os, re, shutil, sys, time, urllib.parse, urllib.request
HEADERS = {"User-Agent": "halal.shopping/1.0 (places builder)", "Accept": "text/tab-separated-values"}
ENDPOINT = "https://qlever.dev/api/osm-planet"  # the whole OpenStreetMap planet, queried in seconds
OUT = "data/places"
# Cuisines that are halal in the vast majority of venues. These are shown as "to confirm", never as declared.
LIKELY = ["kebab", "turkish", "pakistani", "lebanese", "moroccan", "arab", "middle_eastern", "afghan", "syrian", "persian",
          "bangladeshi", "shawarma", "falafel", "tunisian", "algerian", "egyptian", "iraqi", "yemeni", "somali", "uzbek", "uyghur"]
COLS = ["halal", "diet:halal", "butcher", "cuisine", "addr:street", "addr:housenumber", "addr:city", "amenity", "shop", "tourism", "craft"]
def sparql(where):
    opt = " ".join("OPTIONAL { ?s osmkey:%s ?v%d }" % (k, i) for i, k in enumerate(COLS))
    return ("PREFIX osmkey: <https://www.openstreetmap.org/wiki/Key:> PREFIX geo: <http://www.opengis.net/ont/geosparql#> "
            "PREFIX geof: <http://www.opengis.net/def/function/geosparql/> SELECT ?s ?name ?lat ?lon %s WHERE { %s ?s osmkey:name ?name ; "
            "geo:hasGeometry/geo:asWKT ?wkt . BIND(geof:centroid(?wkt) AS ?c) BIND(geof:latitude(?c) AS ?lat) BIND(geof:longitude(?c) AS ?lon) %s }"
            % (" ".join("?v%d" % i for i in range(len(COLS))), where, opt))
RX = "(^|;) ?(%s)( ?;|$)" % "|".join(LIKELY)
QUERIES = [
    ("declared", sparql('{ ?s osmkey:diet:halal ?h . FILTER(?h = "yes" || ?h = "only") } UNION { ?s osmkey:halal "yes" } UNION { ?s osmkey:butcher "halal" }')),
    ("likely", sparql('?s osmkey:cuisine ?cu . FILTER REGEX(?cu, "%s")' % RX.replace("\\", "\\\\"))),
    ("butchers", sparql('?s osmkey:shop "butcher" .')),
]

# Every butcher is listed: the ones not tagged halal are shown as "to confirm" and sorted out by members.
SAYS_HALAL = re.compile(r"halal|helal|حلال|ハラール|清真|халяль|हलाल|হালাল", re.I)
NOT_HALAL = re.compile(r"porc|pork|cochon|charcut|schwein|varken|cerdo|jam[oó]n|maiale|salumer|chevalin|paard|pferd|horse", re.I)

def declared(g):
    if SAYS_HALAL.search(g.get("name") or ""): return True  # the venue's own name says so
    return g.get("diet:halal") in ("yes", "only") or g.get("halal") == "yes" or (g.get("shop") == "butcher" and g.get("butcher") == "halal")
OUT = "data/places"

def lit(v):
    """A TSV cell from the endpoint -> plain text."""
    v = v.strip()
    if v.startswith('"'):
        end = v.rfind('"')
        v = v[1:end].replace('\\"', '"').replace("\\n", " ").replace("\\t", " ").replace("\\\\", "\\")
    return v

def fetch(label, q):
    """Return OpenStreetMap elements shaped like {type, id, lat, lon, tags}, or None when the endpoint fails."""
    for attempt in range(4):
        try:
            req = urllib.request.Request(ENDPOINT, data=urllib.parse.urlencode({"query": q}).encode(), headers=HEADERS)
            rows = urllib.request.urlopen(req, timeout=600).read().decode("utf-8").split("\n")
            els = []
            for row in rows[1:]:
                c = row.split("\t")
                if len(c) < 4 + len(COLS): continue
                m = re.match(r"<https://www\.openstreetmap\.org/(node|way|relation)/(\d+)>", c[0])
                if not m: continue
                try: la, lo = float(lit(c[2])), float(lit(c[3]))
                except ValueError: continue
                tags = {"name": lit(c[1])}
                for k, v in zip(COLS, c[4:]):
                    if v.strip(): tags[k] = lit(v)
                els.append({"type": m.group(1), "id": int(m.group(2)), "lat": la, "lon": lo, "tags": tags})
            print(label, len(els), "rows", flush=True)
            if els: return els
        except Exception as e:
            print(label, "failed:", e, flush=True)
        time.sleep(30)
    return None

def kind(g):
    if g.get("shop") == "butcher": return "b"
    if g.get("amenity") == "fast_food": return "f"
    if g.get("amenity") in ("restaurant", "cafe", "food_court"): return "r"
    return "s"

def compact(e):
    g = e.get("tags") or {}
    name = (g.get("name") or "").strip()
    c = e.get("center") or {}
    la, lo = e.get("lat", c.get("lat")), e.get("lon", c.get("lon"))
    if not name or la is None or lo is None: return None
    if not (g.get("amenity") or g.get("shop") or g.get("tourism") or g.get("craft")): return None  # closed or not a venue
    dec = declared(g)
    if not dec and (g.get("diet:halal") == "no" or g.get("halal") == "no"): return None  # explicitly not halal
    likely = any(c.strip() in LIKELY for c in (g.get("cuisine") or "").split(";"))
    if not dec and not likely:
        if g.get("shop") != "butcher": return None
        if g.get("butcher") in ("pork", "horse") or NOT_HALAL.search(name): return None
    p = {"i": e["type"][0] + str(e["id"]), "n": name[:80], "la": round(la, 5), "lo": round(lo, 5), "t": kind(g)}
    a = " ".join(x for x in (g.get("addr:street"), g.get("addr:housenumber")) if x)
    if a: p["a"] = a[:80]
    if g.get("addr:city"): p["c"] = g["addr:city"][:40]
    k = (g.get("cuisine") or "").split(";")[0].replace("_", " ").strip()
    if k: p["k"] = k[:30]
    if not dec: p["p"] = 1 if likely else 2  # 1: cuisine usually halal, 2: unverified butcher; both to be confirmed by members
    return p

def main():
    els = []
    for label, q in QUERIES:
        more = fetch(label, q)
        if more is None: print("Source unavailable: keeping the previous files."); sys.exit(0 if os.path.isdir(OUT) else 1)
        els += more
    places, seen = [], set()
    for e in els:
        p = compact(e)
        if p and p["i"] not in seen:
            seen.add(p["i"]); places.append(p)
    print(len(places), "named places,", sum(1 for p in places if "p" not in p), "declared", flush=True)
    if len(places) < 1000:
        print("Too few results: keeping the previous files untouched."); sys.exit(0 if os.path.isdir(OUT) else 1)
    # An unverified butcher surrounded by halal venues is worth asking members about first ("q").
    grid = {}
    for x in places:
        if x.get("p") != 2: grid.setdefault((round(x["la"] / 0.003), round(x["lo"] / 0.003)), []).append(x)
    for x in places:
        if x.get("p") != 2: continue
        a, o, n = round(x["la"] / 0.003), round(x["lo"] / 0.003), 0
        for da in (-1, 0, 1):
            for do in (-1, 0, 1):
                for y in grid.get((a + da, o + do), ()):
                    if abs(y["la"] - x["la"]) < 0.0027 and abs(y["lo"] - x["lo"]) * math.cos(math.radians(x["la"])) < 0.0027: n += 1
        if n >= 5: x["q"] = 1
    print(sum(1 for x in places if x.get("q")), "butchers in halal-dense streets", flush=True)
    tiles = {}
    for p in places:
        tiles.setdefault(f"{math.floor(p['la'])}_{math.floor(p['lo'])}", []).append(p)
    tmp = OUT + ".tmp"
    shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    for k, v in tiles.items():
        v.sort(key=lambda p: p["i"])
        json.dump(v, open(f"{tmp}/{k}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"n": len(places), "declared": sum(1 for p in places if "p" not in p), "tiles": {k: len(v) for k, v in sorted(tiles.items())}},
              open(f"{tmp}/index.json", "w"), separators=(",", ":"))
    shutil.rmtree(OUT, ignore_errors=True); os.rename(tmp, OUT)
    print(len(tiles), "tiles written")

if __name__ == "__main__": main()
