#!/bin/bash
# Wird : lecture enchaînée du Hisn al-Muslim. build by Uxlab.ai. N'affecte que Wird.
set -e
B=https://raw.githubusercontent.com/Elbakr/halal-shopping/wird-maj/wird
T=$(mktemp -d)
curl -sfo $T/index.html $B/index.html && curl -sfo $T/sw.js $B/sw.js
echo "$1  $T/index.html" | sha256sum -c -
grep -q hpStart $T/index.html
TS=$(date +%Y%m%d-%H%M)
sudo cp /var/www/wird/index.html /var/lib/wird-push/index.html.avant-hisn-$TS
sudo cp /var/www/wird/sw.js /var/lib/wird-push/sw.js.avant-hisn-$TS
sudo install -o www-data -g www-data -m 644 $T/index.html /var/www/wird/index.html
sudo install -o www-data -g www-data -m 644 $T/sw.js /var/www/wird/sw.js
echo DEPLOYE
