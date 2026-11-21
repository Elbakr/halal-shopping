#!/bin/bash
# ROBOT UNIVERSEL de nuit (hs-robot.timer) — parcourt halal.shopping comme un humain, en LECTURE SEULE garantie
# (toute requête autre que GET/HEAD/OPTIONS est bloquée dans le navigateur), contrôle de santé avant de partir.
# Chaque rouge devient une tâche dans le registre ; un écran redevenu vert ferme sa tâche. build by Uxlab.ai
set -u
A=/opt/hs/accepte/server; [ -d $A ] || A=/opt/hs/repo/server
. $A/porte/env.sh
[ -f /opt/hs/outils/.pret ] || { echo "outils pas encore installés"; exit 0; }
exec 9>/run/hs-lourd.lock; flock -w 7200 9   # jamais en même temps que la génération de nuit ou la porte (mémoire)
J=$(date -u +%F); OUT=$ETAT/robot/$J
mkdir -p $ETAT/robot; rm -rf $OUT; mkdir -p $OUT; chown hsrobot $OUT
runuser -u hsrobot -- env ROBOT_DEPART="/?lang=fr,/?lang=ar" PATH=$PATH PW_PACKAGE=$PW_PACKAGE PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH HOME=$HOME \
  timeout 3000 node $A/robot/robot-universel.mjs https://halal.shopping $OUT 40 20 "Pixel 7" > $OUT/journal.txt 2>&1
c=$?
ln -sfn $OUT $ETAT/robot/dernier
echo "robot: $(tail -1 $OUT/journal.txt | cut -c1-200) (code $c, $(date -u +%FT%TZ))" > $ETAT/robot.txt
ETAT=$ETAT python3 $A/porte/registre.py --depuis-robot $OUT/rapport.json
find $ETAT/robot -maxdepth 1 -type d -name '20*' -mtime +14 -exec rm -rf {} + 2>/dev/null
exit 0
