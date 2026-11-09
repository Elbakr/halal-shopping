"""Halal-declared shops and restaurants from OpenStreetMap, cut into 1-degree tiles the site loads instantly.
Only what OpenStreetMap contributors declared (diet:halal / halal / butcher=halal). Nothing is invented."""
import json, math, os, shutil, sys, time, urllib.parse, urllib.request
HEADERS = {"User-Agent": "halal.shopping/1.0 (places builder)"}
HOSTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
         "https://overpass.private.coffee/api/interpreter"]
Q = """[out:json][timeout:600][maxsize:1073741824];
(nwr["diet:halal"~"^(yes|only)$"];nwr["halal"="yes"];nwr["shop"="butcher"]["butcher"="halal"];);
out center tags;"""
OUT = "data/places"

def fetch():
    for attempt in range(3):
        for h in HOSTS:
            try:
                req = urllib.request.Request(h, data=urllib.parse.urlencode({"data": Q}).encode(), headers=HEADERS)
                j = json.load(urllib.request.urlopen(req, timeout=900))
                els = j.get("elements") or []
                print(h, len(els), "elements", flush=True)
                if els: return els
            except Exception as e:
                print(h, "failed:", e, flush=True)
            time.sleep(20)
    return []

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
    p = {"i": e["type"][0] + str(e["id"]), "n": name[:80], "la": round(la, 5), "lo": round(lo, 5), "t": kind(g)}
    a = " ".join(x for x in (g.get("addr:street"), g.get("addr:housenumber")) if x)
    if a: p["a"] = a[:80]
    if g.get("addr:city"): p["c"] = g["addr:city"][:40]
    k = (g.get("cuisine") or "").split(";")[0].replace("_", " ").strip()
    if k: p["k"] = k[:30]
    return p

def main():
    els = fetch()
    places, seen = [], set()
    for e in els:
        p = compact(e)
        if p and p["i"] not in seen:
            seen.add(p["i"]); places.append(p)
    print(len(places), "named places", flush=True)
    if len(places) < 1000:
        print("Too few results: keeping the previous files untouched."); sys.exit(0 if os.path.isdir(OUT) else 1)
    tiles = {}
    for p in places:
        tiles.setdefault(f"{math.floor(p['la'])}_{math.floor(p['lo'])}", []).append(p)
    tmp = OUT + ".tmp"
    shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    for k, v in tiles.items():
        v.sort(key=lambda p: p["i"])
        json.dump(v, open(f"{tmp}/{k}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"n": len(places), "tiles": {k: len(v) for k, v in sorted(tiles.items())}},
              open(f"{tmp}/index.json", "w"), separators=(",", ":"))
    shutil.rmtree(OUT, ignore_errors=True); os.rename(tmp, OUT)
    print(len(tiles), "tiles written")

if __name__ == "__main__": main()
