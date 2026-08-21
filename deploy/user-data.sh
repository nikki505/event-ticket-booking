#!/bin/bash
# EC2 bootstrap for the Event Ticket Booking System.
# IFN636 Assessment 1, Nikhittha Mukkala N12202665.
#
# This runs automatically the first time the instance boots. Doing it this way instead
# of typing commands over SSH means the whole deployment is written down and repeatable,
# which is what the brief asks for. If the instance is ever lost I can launch a new one
# with this same script and get the same result.
#
# Target AMI: Amazon Linux 2023
#
# Everything it does:
#   1. install Node, git and nginx
#   2. install and start MongoDB, listening only on localhost
#   3. clone the repository
#   4. build the React app and install the API dependencies
#   5. write the .env file with a freshly generated secret
#   6. run the API under pm2 so it comes back after a reboot
#   7. put nginx in front on port 80

set -euxo pipefail
exec > >(tee /var/log/user-data.log) 2>&1   # keep a log so I can see what happened

APP_USER=ec2-user
APP_DIR=/home/$APP_USER/event-ticket-booking
REPO=https://github.com/nikki505/event-ticket-booking.git

echo "=== 1. system packages ==="
dnf update -y
dnf install -y git nginx
# Node 20 from the NodeSource repo. The version in the default repo is older than the
# one I developed against.
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

echo "=== 2. mongodb ==="
cat > /etc/yum.repos.d/mongodb-org-7.0.repo <<'REPO'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
REPO

dnf install -y mongodb-org

# Security. The database listens on 127.0.0.1 only, so even though it runs on the same
# box as the API it cannot be reached from the internet. Port 27017 is never opened in
# the security group either. That covers requirement N6.
sed -i 's/^  bindIp:.*/  bindIp: 127.0.0.1/' /etc/mongod.conf

systemctl enable --now mongod

echo "=== 3. application ==="
sudo -u $APP_USER git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "=== 4. build ==="
sudo -u $APP_USER npm --prefix backend ci --omit=dev
sudo -u $APP_USER npm --prefix frontend ci
sudo -u $APP_USER npm --prefix frontend run build

echo "=== 5. environment ==="
# The secret is generated here on the instance. It is never in the repository and never
# in this script, which is requirement N3.
JWT_SECRET=$(openssl rand -hex 48)

sudo -u $APP_USER tee "$APP_DIR/backend/.env" > /dev/null <<ENVFILE
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27017/eventtickets
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
ENVFILE
chmod 600 "$APP_DIR/backend/.env"

echo "=== 6. run the api under pm2 ==="
npm install -g pm2
sudo -u $APP_USER pm2 start "$APP_DIR/backend/src/server.js" --name eventtix
sudo -u $APP_USER pm2 save
# makes pm2 start on boot, so requirement N4 still holds after a restart
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
systemctl enable pm2-$APP_USER

echo "=== 7. nginx in front ==="
# nginx is the only thing listening publicly. It serves the built React files and passes
# anything starting with /api through to node on 5000, so there is one way in, not two.
cat > /etc/nginx/conf.d/eventtix.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    root /home/ec2-user/event-ticket-booking/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React Router handles the paths in the browser, so any unknown path has to return
    # index.html. Without this, refreshing on /bookings would give a 404 from nginx.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# nginx needs to be able to read through the home directory to reach dist
chmod 755 /home/$APP_USER

rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl enable --now nginx
systemctl restart nginx

echo "=== done ==="
curl -s http://localhost/api/health || echo "health check did not answer"
