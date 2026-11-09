"""Rebuild data/shelves.json: products with a halal claim, per aisle, from Open Food Facts (search-a-licious)."""
import json, os, sys, urllib.parse, urllib.request, time
sys.path.insert(0, os.path.dirname(__file__))
from verify import still_has

SHELVES = {
    "candies": "en:candies", "chocolates": "en:chocolates", "biscuits": "en:biscuits",
    "sausages": "en:sausages", "meats": "en:meats", "cheeses": "en:cheeses",
    "frozen": "en:frozen-foods", "snacks": "en:salty-snacks", "beverages": "en:beverages",
}
FIELDS = "code,product_name,product_name_fr,product_name_nl,product_name_en,brands,image_front_small_url"
out = {"updated": time.strftime("%Y-%m-%d"), "shelves": {}}
for key, cat in SHELVES.items():
    q = f'categories_tags:"{cat}" AND labels_tags:"en:halal"'
    url = "https://search.openfoodfacts.org/search?" + urllib.parse.urlencode(
        {"q": q, "page_size": 40, "sort_by": "-unique_scans_n", "fields": FIELDS})
    req = urllib.request.Request(url, headers={"User-Agent": "halal.shopping/1.0 (shelves builder)"})
    hits = json.load(urllib.request.urlopen(req, timeout=60)).get("hits", [])
    keep = []
    for h in hits:
        name = h.get("product_name_fr") or h.get("product_name") or h.get("product_name_en")
        if not name or not h.get("image_front_small_url"):
            continue
        b = h.get("brands")
        h["brands"] = ", ".join(b) if isinstance(b, list) else (b or "")
        if not still_has(h["code"], []):
            continue
        keep.append(h)
        if len(keep) == 12:
            break
    out["shelves"][key] = keep
    print(key, len(keep))
    time.sleep(1)
if sum(len(v) for v in out["shelves"].values()) == 0:
    raise SystemExit("No data fetched, keeping previous file")
json.dump(out, open("data/shelves.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
