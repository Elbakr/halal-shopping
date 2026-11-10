#!/bin/bash
# Runs every 5 minutes: applies server/ from the repository when it changes, then writes a public status page.
set -u
cd /opt/hs/repo || exit 1
git fetch -q --depth 1 origin main && git reset -q --hard origin/main
NEW=$(git rev-parse HEAD:server 2>/dev/null)
OLD=$(cat /opt/hs/.deployed 2>/dev/null)
if [ -n "$NEW" ] && [ "$NEW" != "$OLD" ]; then
  install -m 755 server/deploy.sh /opt/hs/deploy.sh
  rsync -a --delete server/pb_migrations/ /opt/hs/pb/pb_migrations/
  rsync -a --delete server/pb_hooks/ /opt/hs/pb/pb_hooks/
  chown -R pb:pb /opt/hs/pb
  systemctl restart pocketbase
  echo "$NEW" > /opt/hs/.deployed
  sleep 4
fi
# Machine setup kept in the repository, applied whenever it differs (cheap checks, every run).
if ! cmp -s server/caddy/Caddyfile /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.prev 2>/dev/null
  cp server/caddy/Caddyfile /etc/caddy/Caddyfile
  if caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then systemctl reload caddy; else cp /etc/caddy/Caddyfile.prev /etc/caddy/Caddyfile; fi
fi
mkdir -p /var/www/data
if [ ! -f /var/www/data/places/index.json ]; then  # first install: start from the copy in the repository
  cp -r data/places /var/www/data/places && cp data/chains.json /var/www/data/chains.json
  python3 scripts/share_index.py /var/www/data/places /var/www/data >/dev/null 2>&1
fi
cmp -s server/gen.sh /opt/hs/gen.sh || install -m 755 server/gen.sh /opt/hs/gen.sh
FIRST=0; [ -f /etc/systemd/system/hs-places.timer ] || FIRST=1
CH=0
for u in hs-places.service hs-places.timer; do cmp -s "server/systemd/$u" "/etc/systemd/system/$u" || { cp "server/systemd/$u" "/etc/systemd/system/$u"; CH=1; }; done
if [ "$CH" = 1 ]; then systemctl daemon-reload; systemctl enable --now hs-places.timer >/dev/null 2>&1; fi
[ "$FIRST" = 1 ] && systemctl start --no-block hs-places.service
{
  echo "time: $(date -u +%FT%TZ)"
  echo "deployed: $(cat /opt/hs/.deployed 2>/dev/null)"
  echo "pocketbase: $(systemctl is-active pocketbase) v$(cat /opt/hs/pb/VERSION 2>/dev/null)"
  echo "caddy: $(systemctl is-active caddy)"
  echo "health: $(curl -s -m 5 http://127.0.0.1:8090/api/health | head -c 200)"
  echo "timer: $(systemctl is-active hs-deploy.timer)"
  echo "disk: $(df -h / | tail -1 | awk '{print $3" / "$2}')"
  echo "memory: $(free -m | awk '/Mem:/{print $3" / "$2" MB"}')"
  cat /var/www/status/places.txt 2>/dev/null || echo "places: never run"
  echo "places timer: $(systemctl is-active hs-places.timer) next $(systemctl show hs-places.timer -p NextElapseUSecRealtime --value 2>/dev/null)"
  echo "contributions: $(ls /opt/hs/pb/pb_data/storage 2>/dev/null | wc -l) storage dirs"
  echo "--- pocketbase log (errors only)"
  journalctl -u pocketbase -n 60 --no-pager 2>/dev/null | grep -iv -e token -e '/_/' -e password | grep -i -e error -e fail -e panic -e 'started' | tail -15
  echo "--- bootstrap tail"
  tail -5 /var/log/hs-bootstrap.log 2>/dev/null | grep -iv -e password -e token
} > /var/www/status/_status.txt 2>&1
