#!/bin/bash
# PORTE du serveur (build by Uxlab.ai). Appelée par deploy.sh, en root.
#   porte-serveur.sh avant <dossier server/ de la version> <dossier du site> <sortie>
#       Lance un PocketBase d'essai (127.0.0.1:8091) sur une COPIE de la base (clés effacées) avec les hooks et
#       migrations proposés, sert le site sur 127.0.0.1:8092, et passe le test zéro dessus. La production n'est pas touchée.
#   porte-serveur.sh apres <sortie>
#       Test zéro sur halal.shopping en ligne, juste après l'application.
# Codes : 0 vert, 1 rouge (refus / retour), 2 non valable (production malade : on ne juge pas).
set -u
D=$(cd "$(dirname "$0")" && pwd); . "$D/env.sh"
MODE=$1; shift
TZ0=$(dirname "$D")/../tests/zero; [ -d "$TZ0" ] || TZ0=/opt/hs/repo/tests/zero
mkdir -p /opt/hs/etat; RC=/opt/hs/etat/rouges-connus-serveur.json; [ -f $RC ] || cp /opt/hs/repo/tests/zero/rouges-connus.json $RC 2>/dev/null || echo '[]' > $RC
chown hsrobot $RC
verdict() { echo "{\"verdict\":\"$1\",\"raison\":\"$2\",\"detail\":$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1][-500:]))' "${3:-}"),\"nouveaux\":[]}" > "$OUT/porte.json"; }
if [ "$MODE" = avant ]; then
  SRV=$1 SITE_DIR=$2 OUT=$3
  rm -rf "$OUT"; mkdir -p "$OUT"; chown hsrobot "$OUT"
  [ "$(curl -s -o /dev/null -w '%{http_code}' -m 8 http://127.0.0.1:8090/api/health)" = 200 ] || { verdict "NON VALABLE" "production malade avant l'essai"; exit 2; }
  E=/opt/hs/essai; pkill -f "127.0.0.1:8091" 2>/dev/null; pkill -f "http.server 8092" 2>/dev/null; sleep 1
  rm -rf $E; mkdir -p $E/pb_data
  for db in data auxiliary; do [ -f /opt/hs/pb/pb_data/$db.db ] && sqlite3 /opt/hs/pb/pb_data/$db.db ".backup '$E/pb_data/$db.db'"; done
  sqlite3 $E/pb_data/data.db "DELETE FROM hs_secrets;" 2>/dev/null   # aucune clé dans l'essai : pas d'appel payant, pas de fuite
  cp -r "$SRV/pb_hooks" $E/pb_hooks; cp -r "$SRV/pb_migrations" $E/pb_migrations; chown -R pb:pb $E
  runuser -u pb -- env HS_ESSAI=1 /opt/hs/pb/pocketbase serve --dir $E/pb_data --hooksDir $E/pb_hooks --migrationsDir $E/pb_migrations --http 127.0.0.1:8091 > "$OUT/essai-pocketbase.log" 2>&1 &
  PB=$!
  runuser -u hsrobot -- python3 -m http.server 8092 --bind 127.0.0.1 --directory "$SITE_DIR" > /dev/null 2>&1 &
  WS=$!
  ok=0; for i in $(seq 1 40); do [ "$(curl -s -o /dev/null -w '%{http_code}' -m 3 http://127.0.0.1:8091/api/health)" = 200 ] && { ok=1; break; }; sleep 1; done
  sleep 2
  if [ $ok = 1 ] && grep -qi -e "failed to execute" -e "SyntaxError" -e "failed to apply" -e "migrat.*fail" "$OUT/essai-pocketbase.log"; then
    verdict ROUGE "hooks ou migrations en erreur au démarrage du serveur d'essai" "$(grep -i -A2 -e error -e failed "$OUT/essai-pocketbase.log" | grep -iv -e token -e password | head -8)"; c=1
  elif [ $ok = 1 ]; then
    runuser -u hsrobot -- env SITE=http://127.0.0.1:8092/ API=http://127.0.0.1:8091 RATCHET=$RC NODE_PATH=$NODE_PATH PATH=$PATH PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH HOME=$HOME \
      timeout 900 "$TZ0/porte.sh" "$OUT" > "$OUT/porte.log" 2>&1
    c=$?; [ $c = 2 ] && c=1   # ici, une API qui tombe pendant l'essai, c'est la version proposée : rouge
    [ $c = 124 ] && { verdict ROUGE "essai trop long (plus de 15 min)"; c=1; }
  else
    verdict ROUGE "le serveur d'essai ne démarre pas avec cette version" "$(grep -iv -e token -e password "$OUT/essai-pocketbase.log" | tail -8)"; c=1
  fi
  kill $PB $WS 2>/dev/null; wait $PB $WS 2>/dev/null; rm -rf $E
  exit $c
elif [ "$MODE" = apres ]; then
  OUT=$1; rm -rf "$OUT"; mkdir -p "$OUT"; chown hsrobot "$OUT"
  runuser -u hsrobot -- env SERRER=1 RATCHET=$RC NODE_PATH=$NODE_PATH PATH=$PATH PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH HOME=$HOME \
    timeout 900 "$TZ0/porte.sh" "$OUT" > "$OUT/porte.log" 2>&1
  c=$?; [ $c = 124 ] && { verdict ROUGE "test en ligne trop long (plus de 15 min)"; c=1; }
  exit $c
fi
echo "usage: porte-serveur.sh avant|apres ..."; exit 2
