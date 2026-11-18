#!/bin/bash
# Outils de la porte et du robot, installés une fois (hs-outils.service) : Node, Playwright + Chromium, sqlite3,
# et l'utilisateur sans droits « hsrobot » qui fait tourner le navigateur. build by Uxlab.ai
set -eu
export DEBIAN_FRONTEND=noninteractive
O=/opt/hs/outils; mkdir -p $O /opt/hs/etat
apt-get install -y sqlite3 xz-utils >/dev/null
ARCH=x64; [ "$(uname -m)" = aarch64 ] && ARCH=arm64; V=v22.11.0
if ! /opt/hs/node/bin/node -v >/dev/null 2>&1; then
  curl -fsSL "https://nodejs.org/dist/$V/node-$V-linux-$ARCH.tar.xz" | tar -xJ -C /opt/hs
  rm -rf /opt/hs/node && mv "/opt/hs/node-$V-linux-$ARCH" /opt/hs/node
fi
export PATH=/opt/hs/node/bin:$PATH PLAYWRIGHT_BROWSERS_PATH=$O/navigateurs
cd $O; [ -f package.json ] || npm init -y >/dev/null
npm i playwright@1.49.1 >/dev/null
npx playwright install --with-deps chromium
id hsrobot >/dev/null 2>&1 || useradd -r -m -d /opt/hs/hsrobot -s /usr/sbin/nologin hsrobot
chmod -R a+rX $O /opt/hs/node
date -u +%FT%TZ > $O/.pret
echo "outils prêts : node $(node -v), playwright 1.49.1"
