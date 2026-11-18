#!/bin/bash
# PORTE — lance le test zéro et applique le cliquet. build by Uxlab.ai
# Usage : porte.sh <dossier-sortie>    Variables : SITE, API (voir test_zero.js), RATCHET (liste des rouges connus), SERRER=1
# Codes : 0 porte ouverte (vert), 1 porte fermée (rouge nouveau), 2 non valable (serveur malade avant le test)
D=$(cd "$(dirname "$0")" && pwd); OUT=${1:?dossier}; mkdir -p "$OUT"
RC=${RATCHET:-$D/rouges-connus.json}; [ -f "$RC" ] || echo '[]' > "$RC"
API=${API:-https://api.halal.shopping}
for i in 1 2 3; do  # santé avant de juger : un serveur malade ne doit pas faire refuser une version saine
  c=$(curl -s -o /dev/null -w '%{http_code}' -m 8 "$API/api/health"); [ "$c" = 200 ] && break
  [ $i = 3 ] && { echo "PORTE NON VALABLE : $API/api/health répond $c"; echo "{\"verdict\":\"NON VALABLE\",\"raison\":\"api $c\"}" > "$OUT/porte.json"; exit 2; }
  sleep 10
done
node "$D/test_zero.js" "$OUT/1" > "$OUT/1.log" 2>&1
S=""; [ "${SERRER:-0}" = 1 ] && S=--serrer
node "$D/porte.js" "$RC" "$OUT/porte.json" "$OUT/1/resultats.json" $S && exit 0
# Second passage : seul un rouge présent deux fois de suite ferme la porte.
node "$D/test_zero.js" "$OUT/2" > "$OUT/2.log" 2>&1
node "$D/porte.js" "$RC" "$OUT/porte.json" "$OUT/1/resultats.json" "$OUT/2/resultats.json" $S
