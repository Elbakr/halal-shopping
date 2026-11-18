#!/bin/bash
# Runs every 3 minutes (hs-deploy.timer). build by Uxlab.ai
# PORTE : une nouvelle version de server/ n'est appliquée que si elle passe le test zéro AVANT (PocketBase d'essai
# sur une copie de la base) ; APRÈS application, test zéro en ligne : rouge = retour automatique à la version précédente.
# Rouge nouveau = refus (cliquet /opt/hs/etat/rouges-connus-serveur.json). Chaque rouge devient une tâche du registre.
# Branche « essai-serveur » : même porte, à blanc (jamais appliquée) — pour prouver qu'une version cassée est refusée.
set -u
cd /opt/hs/repo || exit 1
git fetch -q --depth 50 origin main && git reset -q --hard origin/main
git fetch -q --depth 1 origin porte:refs/remotes/origin/porte 2>/dev/null
git fetch -q --depth 1 origin essai-serveur:refs/remotes/origin/essai-serveur 2>/dev/null || git update-ref -d refs/remotes/origin/essai-serveur 2>/dev/null
E=/opt/hs/etat; P=/var/www/status/etat; A=/opt/hs/accepte
mkdir -p $E $P/porte
NEW=$(git rev-parse HEAD:server 2>/dev/null)
OLD=$(cat /opt/hs/.deployed 2>/dev/null)
C=$(git rev-parse --short HEAD)
# La version en place est la première version acceptée (amorçage de la porte).
if [ ! -d $A/server ] && [ "$NEW" = "$OLD" ]; then mkdir -p $A/tests && rsync -a --delete server/ $A/server/ && rsync -a --delete tests/zero/ $A/tests/zero/; fi
PS=$A/server/porte/porte-serveur.sh; [ -f $PS ] || PS=/opt/hs/repo/server/porte/porte-serveur.sh
REG="python3 $A/server/porte/registre.py"; [ -f $A/server/porte/registre.py ] || REG="python3 /opt/hs/repo/server/porte/registre.py"
say() { echo "$(date -u +%FT%TZ) $*" > $P/porte.txt; echo "$(date -u +%FT%TZ) $*" >> $E/porte.log; }

# Outils de la porte (Node, Playwright, Chromium) : installés une fois, en arrière-plan ; réessayés seulement si outils.sh change.
if [ ! -f /opt/hs/outils/.pret ]; then
  cmp -s server/systemd/hs-outils.service /etc/systemd/system/hs-outils.service || { cp server/systemd/hs-outils.service /etc/systemd/system/; systemctl daemon-reload; }
  H=$(sha1sum server/porte/outils.sh | cut -c1-12)
  if [ "$H" != "$(cat $E/outils.essai 2>/dev/null)" ] && ! systemctl is-active -q hs-outils.service; then echo "$H" > $E/outils.essai; systemctl start --no-block hs-outils.service; fi
fi

if [ -n "$NEW" ] && [ "$NEW" != "$OLD" ] && [ "$NEW" != "$(cat $E/refuse 2>/dev/null)" ]; then
  exec 9>/run/hs-lourd.lock
  if [ ! -f /opt/hs/outils/.pret ]; then say "attente : version $C en attente, outils de la porte en installation (rien n'est appliqué sans porte)"
  elif ! flock -n 9; then say "attente : version $C en attente, génération de nuit ou robot en cours"
  else
    bash $PS avant /opt/hs/repo/server /opt/hs/repo $P/porte/avant; c=$?
    if [ $c = 0 ]; then
      $REG --depuis-porte porte-serveur $P/porte/avant/porte.json "Version serveur $C refusée par la porte"
      rm -rf /opt/hs/prec && mkdir -p /opt/hs/prec && cp -a /opt/hs/pb/pb_hooks /opt/hs/pb/pb_migrations /opt/hs/deploy.sh /opt/hs/prec/ && echo "$OLD" > /opt/hs/prec/deployed
      bash -n server/deploy.sh && install -m 755 server/deploy.sh /opt/hs/deploy.sh
      rsync -a --delete server/pb_migrations/ /opt/hs/pb/pb_migrations/
      rsync -a --delete server/pb_hooks/ /opt/hs/pb/pb_hooks/
      chown -R pb:pb /opt/hs/pb
      systemctl restart pocketbase; sleep 5
      bash $PS apres $P/porte/apres; c2=$?
      if [ $c2 != 0 ]; then  # rouge en ligne (ou API morte après redémarrage) : retour automatique
        rsync -a --delete /opt/hs/prec/pb_migrations/ /opt/hs/pb/pb_migrations/
        rsync -a --delete /opt/hs/prec/pb_hooks/ /opt/hs/pb/pb_hooks/
        install -m 755 /opt/hs/prec/deploy.sh /opt/hs/deploy.sh
        chown -R pb:pb /opt/hs/pb; systemctl restart pocketbase
        echo "$NEW" > $E/refuse
        [ $c2 = 2 ] && echo '{"verdict":"ROUGE","raison":"API morte après application","nouveaux":[]}' > $P/porte/apres/porte.json
        $REG --depuis-porte porte-serveur $P/porte/apres/porte.json "Version serveur $C rouge en ligne : retour automatique fait"
        echo "$(date -u +%FT%TZ) $NEW $C RETOUR" >> $E/deploiements.log
        say "RETOUR AUTOMATIQUE : version $C rouge en ligne, version précédente remise ($(head -c 300 $P/porte/apres/porte.json | tr '\n' ' '))"
      else
        echo "$NEW" > /opt/hs/.deployed
        mkdir -p $A/tests && rsync -a --delete server/ $A/server/ && rsync -a --delete tests/zero/ $A/tests/zero/
        $REG --depuis-porte porte-serveur $P/porte/apres/porte.json "Version serveur $C"
        echo "$(date -u +%FT%TZ) $NEW $C appliquée" >> $E/deploiements.log
        say "vert : version $C passée AVANT et APRÈS, appliquée"
      fi
    elif [ $c = 1 ]; then
      echo "$NEW" > $E/refuse
      $REG --depuis-porte porte-serveur $P/porte/avant/porte.json "Version serveur $C refusée par la porte"
      say "REFUSÉE : version $C rouge à l'essai, production inchangée ($(head -c 400 $P/porte/avant/porte.json | tr '\n' ' '))"
    else
      say "attente : production malade, essai de la version $C reporté"
    fi
    flock -u 9
  fi
fi

# Essai à blanc d'une branche « essai-serveur » : la porte juge, rien n'est jamais appliqué.
ES=$(git rev-parse -q --verify "refs/remotes/origin/essai-serveur^{commit}" 2>/dev/null)
if [ -n "$ES" ] && [ "$ES" != "$(cat $E/essai.fait 2>/dev/null)" ] && [ -f /opt/hs/outils/.pret ]; then
  exec 8>/run/hs-lourd.lock
  if flock -n 8; then
    rm -rf /opt/hs/essai-src && mkdir -p /opt/hs/essai-src && git archive "$ES" | tar -x -C /opt/hs/essai-src
    bash $PS avant /opt/hs/essai-src/server /opt/hs/essai-src $P/porte/essai-branche; c=$?
    echo "$ES" > $E/essai.fait
    V=VERT; [ $c = 1 ] && V="REFUSÉE"; [ $c = 2 ] && V="NON VALABLE"
    echo "$(date -u +%FT%TZ) essai à blanc de essai-serveur ${ES::7} : $V — $(head -c 500 $P/porte/essai-branche/porte.json | tr '\n' ' ')" > $P/porte-essai.txt
    rm -rf /opt/hs/essai-src; flock -u 8
  fi
fi

# Verdicts de la porte du site (GitHub Actions, branche « porte ») versés au registre.
if git cat-file -e refs/remotes/origin/porte:site.json 2>/dev/null; then
  git show refs/remotes/origin/porte:site.json > $E/site.json.new
  if ! cmp -s $E/site.json.new $P/porte/site.json; then
    cp $E/site.json.new $P/porte/site.json
    X=$(python3 -c 'import json;v=json.load(open("'$E/site.json.new'"));print({"avant":"Site : version proposée refusée par la porte","retour":"Site : rouge en ligne, retour automatique fait","apres":"Site : test en ligne"}.get(v.get("etape"),"Site"), v.get("sha","")[:7])')
    $REG --depuis-porte porte-site $E/site.json.new "$X"
  fi
fi

# VALEUR : une fois par jour, après le passage de nuit de l'audience (00:20 UTC).
if [ "$(date -u +%H%M)" -ge 0040 ] && [ "$(cat $E/valeur.jour 2>/dev/null)" != "$(date -u +%F)" ]; then
  date -u +%F > $E/valeur.jour
  python3 $A/server/porte/valeur.py > $E/valeur.txt 2>&1 || python3 server/porte/valeur.py > $E/valeur.txt 2>&1
fi

# Machine setup from the last ACCEPTED version (cheap checks, every run).
S=$A/server; [ -d $S ] || S=/opt/hs/repo/server
if ! cmp -s $S/caddy/Caddyfile /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.prev 2>/dev/null
  cp $S/caddy/Caddyfile /etc/caddy/Caddyfile
  if caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then systemctl reload caddy; else cp /etc/caddy/Caddyfile.prev /etc/caddy/Caddyfile; fi
fi
mkdir -p /var/www/data
if [ ! -f /var/www/data/places/index.json ]; then  # first install: start from the copy in the repository
  cp -r data/places /var/www/data/places && cp data/chains.json /var/www/data/chains.json
  python3 scripts/share_index.py /var/www/data/places /var/www/data >/dev/null 2>&1
fi
cmp -s $S/gen.sh /opt/hs/gen.sh || install -m 755 $S/gen.sh /opt/hs/gen.sh
FIRST=0; [ -f /etc/systemd/system/hs-places.timer ] || FIRST=1
CH=0
for u in hs-places.service hs-places.timer hs-robot.service hs-robot.timer; do
  [ -f "$S/systemd/$u" ] || continue
  cmp -s "$S/systemd/$u" "/etc/systemd/system/$u" || { cp "$S/systemd/$u" "/etc/systemd/system/$u"; CH=1; }
done
if [ "$CH" = 1 ]; then systemctl daemon-reload; systemctl enable --now hs-places.timer >/dev/null 2>&1; [ -f /etc/systemd/system/hs-robot.timer ] && systemctl enable --now hs-robot.timer >/dev/null 2>&1; fi
[ "$FIRST" = 1 ] && systemctl start --no-block hs-places.service
# Bump server/places-run to request an extra run now; server/robot-run for an extra robot pass.
if [ -f server/places-run ] && ! cmp -s server/places-run /opt/hs/.places-run; then cp server/places-run /opt/hs/.places-run; systemctl start --no-block hs-places.service; fi
if [ -f server/robot-run ] && ! cmp -s server/robot-run /opt/hs/.robot-run && [ -f /etc/systemd/system/hs-robot.service ]; then cp server/robot-run /opt/hs/.robot-run; systemctl start --no-block hs-robot.service; fi
{
  echo "time: $(date -u +%FT%TZ)"
  echo "deployed: $(cat /opt/hs/.deployed 2>/dev/null)"
  echo "porte: $(cat $P/porte.txt 2>/dev/null | cut -c1-300) $( [ -f /opt/hs/outils/.pret ] || echo '(outils en installation)')"
  echo "porte essai: $(cat $P/porte-essai.txt 2>/dev/null | cut -c1-300)"
  echo "robot: $(cat $P/robot.txt 2>/dev/null | cut -c1-250)"
  echo "registre: $(python3 -c 'import json;r=json.load(open("'$P/registre.json'"));print(r.get("ouvertes",0),"tâche(s) ouverte(s) sur",len(r["taches"]))' 2>/dev/null || echo vide) — https://api.halal.shopping/_etat/registre.json"
  echo "valeur: $(tail -1 $E/valeur.txt 2>/dev/null | cut -c1-200)"
  echo "pocketbase: $(systemctl is-active pocketbase) v$(cat /opt/hs/pb/VERSION 2>/dev/null)"
  echo "caddy: $(systemctl is-active caddy)"
  echo "health: $(curl -s -m 5 http://127.0.0.1:8090/api/health | head -c 200)"
  echo "timer: $(systemctl is-active hs-deploy.timer)"
  echo "disk: $(df -h / | tail -1 | awk '{print $3" / "$2}')"
  echo "memory: $(free -m | awk '/Mem:/{print $3" / "$2" MB"}')"
  cat /var/www/status/places.txt 2>/dev/null || echo "places: never run"
  echo "places service: $(systemctl is-active hs-places.service) (result $(systemctl show hs-places.service -p Result --value 2>/dev/null))"
  journalctl -u hs-places.service -n 4 --no-pager 2>/dev/null | cut -c1-200
  echo "places timer: $(systemctl is-active hs-places.timer) next $(systemctl show hs-places.timer -p NextElapseUSecRealtime --value 2>/dev/null)"
  echo "robot timer: $(systemctl is-active hs-robot.timer 2>/dev/null) next $(systemctl show hs-robot.timer -p NextElapseUSecRealtime --value 2>/dev/null)"
  echo "outils: $(cat /opt/hs/outils/.pret 2>/dev/null || echo "pas prêts ($(systemctl is-active hs-outils.service 2>/dev/null), $(tail -1 /var/log/hs-outils.log 2>/dev/null | cut -c1-120))")"
  echo "contributions: $(ls /opt/hs/pb/pb_data/storage 2>/dev/null | wc -l) storage dirs"
  echo "--- pocketbase log (errors only)"
  journalctl -u pocketbase -n 60 --no-pager 2>/dev/null | grep -iv -e token -e '/_/' -e password | grep -i -e error -e fail -e panic -e 'started' | tail -15
  echo "--- bootstrap tail"
  tail -5 /var/log/hs-bootstrap.log 2>/dev/null | grep -iv -e password -e token
} > /var/www/status/_status.txt 2>&1
