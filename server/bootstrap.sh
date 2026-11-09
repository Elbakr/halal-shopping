#!/bin/bash
# First-boot setup of the halal.shopping API machine (run once by cloud-init, as root).
# Nothing here is secret: the admin password is generated on the machine and never leaves it.
set -u
export DEBIAN_FRONTEND=noninteractive
exec > /var/log/hs-bootstrap.log 2>&1
apt-get update -y
apt-get install -y caddy unzip git ufw curl rsync cron

# 1 GB of swap: the machine has 1 GB of RAM
if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi

ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443; ufw --force enable

id pb >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin pb
mkdir -p /opt/hs/pb /var/www/status

# PocketBase, latest release
V=$(curl -sI https://github.com/pocketbase/pocketbase/releases/latest | grep -i '^location' | sed 's#.*/tag/v##' | tr -d '\r\n')
ARCH=amd64; [ "$(uname -m)" = "aarch64" ] && ARCH=arm64
curl -fsSL -o /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${V}/pocketbase_${V}_linux_${ARCH}.zip"
unzip -o /tmp/pb.zip pocketbase -d /opt/hs/pb
echo "$V" > /opt/hs/pb/VERSION

cat > /etc/systemd/system/pocketbase.service <<'UNIT'
[Unit]
Description=PocketBase (halal.shopping API)
After=network-online.target
[Service]
User=pb
WorkingDirectory=/opt/hs/pb
ExecStart=/opt/hs/pb/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/caddy/Caddyfile <<'CADDY'
api.halal.shopping {
	encode gzip
	request_body {
		max_size 8MB
	}
	handle /_status.txt {
		root * /var/www/status
		file_server
	}
	handle {
		reverse_proxy 127.0.0.1:8090
	}
}
CADDY

git clone --depth 1 https://github.com/Elbakr/halal-shopping /opt/hs/repo
install -m 755 /opt/hs/repo/server/deploy.sh /opt/hs/deploy.sh
chown -R pb:pb /opt/hs/pb

# Admin account: password generated here, kept in /root only
if [ ! -f /root/pb_admin.txt ]; then
  P=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  echo "admin@halal.shopping $P" > /root/pb_admin.txt; chmod 600 /root/pb_admin.txt
  sudo -u pb /opt/hs/pb/pocketbase superuser upsert admin@halal.shopping "$P" --dir /opt/hs/pb/pb_data
fi

systemctl daemon-reload
systemctl enable --now pocketbase
systemctl restart caddy
cat > /etc/systemd/system/hs-deploy.service <<'UNIT'
[Unit]
Description=halal.shopping: apply server/ from the repository and write the status page
[Service]
Type=oneshot
ExecStart=/opt/hs/deploy.sh
UNIT
cat > /etc/systemd/system/hs-deploy.timer <<'UNIT'
[Unit]
Description=Run hs-deploy every 3 minutes
[Timer]
OnCalendar=*:0/3
OnBootSec=90
AccuracySec=10
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now hs-deploy.timer
/opt/hs/deploy.sh
