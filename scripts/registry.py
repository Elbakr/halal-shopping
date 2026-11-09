"""Nightly registry job.
1. data/labels_stats.json : which label tags appear on halal-claimed products (to link products to certifiers).
2. data/snapshot.json + data/changes.json : detect when a tracked product loses its halal claim or changes additives."""
import json, os, sys, time, hashlib, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from verify import still_has
from collections import Counter

S = "https://search.openfoodfacts.org/search?"
UA = {"User-Agent": "halal.shopping/1.0 (registry builder)"}
TODAY = time.strftime("%Y-%m-%d")

def search(q, page, size, fields):
    url = S + urllib.parse.urlencode({"q": q, "page": page, "page_size": size, "sort_by": "-unique_scans_n", "fields": fields})
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90))

# ---- 1. label statistics over the most scanned halal-claimed products
labels, brands_by_label, total = Counter(), {}, 0
CERTS = json.load(open("scripts/certifiers.json", encoding="utf-8"))
for c in CERTS:
    c["count"] = 0; c["products"] = []
tracked = {}
for page in range(1, 31):
    try:
        j = search('labels_tags:"en:halal"', page, 100, "code,labels_tags,additives_tags,ingredients_text,product_name,product_name_fr,product_name_en,brands,image_front_small_url")
    except Exception as e:
        print("page", page, "failed", e); break
    hits = j.get("hits", [])
    if not hits: break
    for h in hits:
        total += 1
        for t in h.get("labels_tags") or []:
            labels[t] += 1
        for c in CERTS:
            if set(c["tags"]) & set(h.get("labels_tags") or []):
                c["count"] += 1
                if len(c["products"]) < 30 and h.get("image_front_small_url") and (h.get("product_name_fr") or h.get("product_name")):
                    b = h.get("brands")
                    c["products"].append({"code": h["code"], "product_name": h.get("product_name") or "", "product_name_fr": h.get("product_name_fr") or "",
                                          "product_name_en": h.get("product_name_en") or "", "brands": ", ".join(b) if isinstance(b, list) else (b or ""),
                                          "image_front_small_url": h["image_front_small_url"]})
        if len(tracked) < 1500 and h.get("code"):
            ing = (h.get("ingredients_text") or "").strip().lower()
            tracked[h["code"]] = {
                "n": h.get("product_name") or "",
                "h": True,
                "a": sorted(h.get("additives_tags") or []),
                "i": hashlib.sha1(ing.encode()).hexdigest()[:12] if ing else "",
            }
    time.sleep(0.6)
if total == 0:
    raise SystemExit("no data, keeping previous files")
json.dump({"updated": TODAY, "products": total, "labels": labels.most_common(400)},
          open("data/labels_stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("products", total, "distinct labels", len(labels))
for c in CERTS:
    ok = []
    for p in c["products"]:
        if still_has(p["code"], c["tags"]):
            ok.append(p)
        if len(ok) == 12: break
    print(c["id"], "verified", len(ok), "of", len(c["products"]))
    c["products"] = ok
json.dump({"updated": TODAY, "sample": total, "list": sorted(CERTS, key=lambda c: -c["count"])}, open("data/certifiers.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# ---- 2. change detection against yesterday's snapshot
old = {}
if os.path.exists("data/snapshot.json"):
    old = json.load(open("data/snapshot.json", encoding="utf-8")).get("products", {})
changes = []
if os.path.exists("data/changes.json"):
    changes = json.load(open("data/changes.json", encoding="utf-8")).get("changes", [])
new_events = []
for code, was in old.items():
    now = tracked.get(code)
    if now is None:
        continue  # fell out of the tracked window: not evidence of a change
    added = sorted(set(now["a"]) - set(was.get("a", [])))
    removed = sorted(set(was.get("a", [])) - set(now["a"]))
    if added or removed:
        new_events.append({"d": TODAY, "c": code, "n": now["n"], "t": "additives", "add": added, "rem": removed})
    elif was.get("i") and now["i"] and was["i"] != now["i"]:
        new_events.append({"d": TODAY, "c": code, "n": now["n"], "t": "ingredients"})
changes = (new_events + changes)[:300]
json.dump({"updated": TODAY, "products": tracked}, open("data/snapshot.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({"updated": TODAY, "tracked": len(tracked), "changes": changes}, open("data/changes.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("tracked", len(tracked), "new events", len(new_events))
