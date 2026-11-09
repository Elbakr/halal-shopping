"""Confirm against the live product record (the search index can lag behind)."""
import json, time, urllib.request
UA = {"User-Agent": "halal.shopping/1.0 (registry builder)"}
def live_labels(code):
    """Return the product's current label tags, or None if the record cannot be read."""
    url = f"https://world.openfoodfacts.org/api/v2/product/{code}?fields=labels_tags"
    for attempt in range(2):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
            time.sleep(0.7)
            return (j.get("product") or {}).get("labels_tags") or [] if j.get("status") == 1 else []
        except Exception:
            time.sleep(3)
    return None
def still_has(code, tags):
    """True only when the live record carries en:halal and one of `tags` (or just en:halal when tags is empty)."""
    l = live_labels(code)
    if l is None: return False
    return "en:halal" in l and (not tags or bool(set(tags) & set(l)))
