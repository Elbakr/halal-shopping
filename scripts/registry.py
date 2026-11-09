"""Nightly registry job.
1. data/labels_stats.json : which label tags appear on halal-claimed products (to link products to certifiers).
2. data/snapshot.json + data/changes.json : detect when a tracked product loses its halal claim or changes additives."""
import json, os, time, hashlib, urllib.parse, urllib.request
from collections import Counter

S = "https://search.openfoodfacts.org/search?"
UA = {"User-Agent": "halal.shopping/1.0 (registry builder)"}
TODAY = time.strftime("%Y-%m-%d")

def search(q, page, size, fields):
    url = S + urllib.parse.urlencode({"q": q, "page": page, "page_size": size, "sort_by": "-unique_scans_n", "fields": fields})
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90))

# ---- 1. label statistics over the most scanned halal-claimed products
labels, brands_by_label, total = Counter(), {}, 0
tracked = {}
for page in range(1, 31):
    try:
        j = search('labels_tags:"en:halal"', page, 100, "code,labels_tags,additives_tags,ingredients_text,product_name,brands")
    except Exception as e:
        print("page", page, "failed", e); break
    hits = j.get("hits", [])
    if not hits: break
    for h in hits:
        total += 1
        for t in h.get("labels_tags") or []:
            labels[t] += 1
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
