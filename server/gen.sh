#!/bin/bash
# Every night: regenerate the halal places from OpenStreetMap and official address registers,
# then publish them at https://api.halal.shopping/data/ . The previous files stay online if anything fails.
set -u
W=/opt/hs/gen; OUT=/var/www/data; ST=/var/www/status/places.txt
mkdir -p "$W/scripts" "$W/data" "$OUT"
rsync -a --delete /opt/hs/repo/scripts/ "$W/scripts/"
[ -f "$W/data/enrich_cache.json" ] || cp /opt/hs/repo/data/enrich_cache.json "$W/data/" 2>/dev/null
[ -d "$W/data/places" ] || cp -r /opt/hs/repo/data/places "$W/data/" 2>/dev/null
echo "places: running since $(date -u +%FT%TZ)" > "$ST"
cd "$W" || exit 1
if timeout 4h nice -n 10 python3 scripts/places.py > /var/log/hs-places.log 2>&1 && [ -s data/places/index.json ]; then
  rm -rf "$OUT/places.new" && cp -r data/places "$OUT/places.new"
  rm -rf "$OUT/places.old"; [ -d "$OUT/places" ] && mv "$OUT/places" "$OUT/places.old"
  mv "$OUT/places.new" "$OUT/places" && rm -rf "$OUT/places.old"
  cp data/chains.json "$OUT/chains.json" 2>/dev/null
  python3 scripts/share_index.py "$OUT/places" "$OUT" >> /var/log/hs-places.log 2>&1
  echo "places: ok $(date -u +%FT%TZ) — $(python3 -c 'import json;d=json.load(open("data/places/index.json"));print(d["n"],"places,",len(d["tiles"]),"tiles")')" > "$ST"
else
  echo "places: FAILED $(date -u +%FT%TZ) — previous files kept. Last lines:" > "$ST"
  tail -5 /var/log/hs-places.log | cut -c1-200 >> "$ST"
fi
