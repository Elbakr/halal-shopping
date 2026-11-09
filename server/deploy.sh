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
{
  echo "time: $(date -u +%FT%TZ)"
  echo "deployed: $(cat /opt/hs/.deployed 2>/dev/null)"
  echo "pocketbase: $(systemctl is-active pocketbase) v$(cat /opt/hs/pb/VERSION 2>/dev/null)"
  echo "caddy: $(systemctl is-active caddy)"
  echo "health: $(curl -s -m 5 http://127.0.0.1:8090/api/health | head -c 200)"
  echo "disk: $(df -h / | tail -1 | awk '{print $3" / "$2}')"
  echo "contributions: $(ls /opt/hs/pb/pb_data/storage 2>/dev/null | wc -l) storage dirs"
  echo "--- pocketbase log (errors only)"
  journalctl -u pocketbase -n 60 --no-pager 2>/dev/null | grep -iv -e token -e '/_/' -e password | grep -i -e error -e fail -e panic -e 'started' | tail -15
  echo "--- bootstrap tail"
  tail -5 /var/log/hs-bootstrap.log 2>/dev/null | grep -iv -e password -e token
} > /var/www/status/_status.txt 2>&1
