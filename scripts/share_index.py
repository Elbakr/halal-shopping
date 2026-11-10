"""Builds the lookup files behind the share pages (https://api.halal.shopping/l/<id>) and the sitemaps.
Usage: python3 scripts/share_index.py <places dir> <output dir>
Writes <out>/ids/<00-99>.json (place id -> tile record), <out>/sitemap.xml and <out>/sitemap-<n>.xml."""
import glob, json, os, sys, time
src, out = sys.argv[1], sys.argv[2]
shards = {}
for f in glob.glob(os.path.join(src, "*_*.json")):
    for r in json.load(open(f, encoding="utf-8")):
        k = r["i"][-2:].rjust(2, "0")
        shards.setdefault(k, {})[r["i"]] = r
os.makedirs(os.path.join(out, "ids"), exist_ok=True)
for k, v in shards.items():
    tmp = os.path.join(out, "ids", k + ".tmp")
    json.dump(v, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, os.path.join(out, "ids", k + ".json"))
ids = sorted(i for v in shards.values() for i in v if v[i].get("n"))
day = time.strftime("%Y-%m-%d", time.gmtime())
B = "https://api.halal.shopping"
parts = [ids[i:i + 45000] for i in range(0, len(ids), 45000)]
for n, part in enumerate(parts):
    with open(os.path.join(out, f"sitemap-{n}.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for i in part:
            fh.write(f"<url><loc>{B}/l/{i}</loc><lastmod>{day}</lastmod></url>\n")
        fh.write("</urlset>\n")
with open(os.path.join(out, "sitemap.xml"), "w", encoding="utf-8") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for n in range(len(parts)):
        fh.write(f"<sitemap><loc>{B}/sitemap-{n}.xml</loc><lastmod>{day}</lastmod></sitemap>\n")
    fh.write("</sitemapindex>\n")
print(len(ids), "places,", len(shards), "shards,", len(parts), "sitemaps")
