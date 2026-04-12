# AuctionBoard — AWS EC2 Deployment Guide

---

## Pre-deployment answers

### WebSockets in production (Socket.io rooms)
Socket.io works on EC2 with **zero changes** to the codebase. The single PM2 instance (`instances: 1` in `ecosystem.config.js`) handles all connections in one process, so all in-memory room state stays consistent. Nginx (set up below) proxies both HTTP and WebSocket traffic to Node.

> **If you ever scale to multiple EC2 instances or multiple PM2 instances:** you'd need to add a Redis adapter (`@socket.io/redis-adapter`) so rooms are shared across processes. That is a future concern — for now, single instance is correct.

AWS App Runner also supports WebSockets, but EC2 gives you more control and is cheaper at this scale.

### MongoDB Atlas instead of local MongoDB
No code changes needed. Atlas is just a different `MONGO_URI`. Set it in your `.env` and the server connects to Atlas automatically. Atlas free tier (M0) is fine for development; M10+ for production.

---

## Required environment variables

Create `server/.env` on the EC2 instance with these values:

```env
# Runtime
NODE_ENV=production
PORT=8000

# MongoDB Atlas connection string
# Get from: Atlas dashboard → your cluster → Connect → Drivers → Node.js
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/auctionboard?retryWrites=true&w=majority

# Auth — generate a strong random string (e.g. openssl rand -hex 32)
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRES_IN=7d

# Set to your domain once DNS is configured, otherwise use the EC2 public IP
CLIENT_URL=https://yourdomain.com

# Image storage
# Option A — local disk (files stored in server/uploads/, persisted on EC2)
STORAGE_BACKEND=local

# Option B — Cloudinary (recommended for production, survives server restarts/migrations)
# STORAGE_BACKEND=cloudinary
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step-by-step EC2 deployment

### Step 1 — Launch EC2 instance

1. Go to **EC2 → Launch Instance**
2. **AMI:** Ubuntu Server 22.04 LTS (free tier eligible)
3. **Instance type:** `t3.small` minimum (1 vCPU, 2 GB RAM); `t3.medium` recommended
4. **Key pair:** create or select one — you need the `.pem` file to SSH in
5. **Security Group — inbound rules:**

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22   | TCP | Your IP only | SSH access |
| 80   | TCP | 0.0.0.0/0 | HTTP (Nginx) |
| 443  | TCP | 0.0.0.0/0 | HTTPS (Nginx + SSL) |

> Do **not** expose port 8000 publicly — Nginx proxies it internally.

6. **Storage:** 20 GB gp3 (enough for OS + app + uploads)
7. Launch the instance, note the **Public IPv4 address**

---

### Step 2 — Connect and update the server

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Update packages
sudo apt update && sudo apt upgrade -y
```

---

### Step 3 — Install Node.js 20 via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 20
nvm use 20
node -v   # should print v20.x.x
```

---

### Step 4 — Install PM2 and Nginx

```bash
npm install -g pm2
sudo apt install nginx -y
```

---

### Step 5 — Clone the repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/AuctionBoard.git
cd AuctionBoard
```

---

### Step 6 — Build the React client

```bash
cd client
npm install
npm run build
cd ..
```

This generates `client/dist/` which Express serves in production.

---

### Step 7 — Install server dependencies

```bash
cd server
npm install --omit=dev
```

---

### Step 8 — Configure environment variables

```bash
# Still inside server/
cp .env.example .env
nano .env
```

Fill in all values from the **Required environment variables** section above. Save with `Ctrl+O`, exit with `Ctrl+X`.

---

### Step 9 — Start with PM2

```bash
# From the repo root
cd ~/AuctionBoard

pm2 start ecosystem.config.js --env production
pm2 save

# Auto-start PM2 on server reboot
pm2 startup
# Copy and run the command it prints (starts with sudo env PATH=...)
```

Verify the app is running:
```bash
pm2 status
curl http://localhost:8000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

### Step 10 — Configure Nginx as reverse proxy

```bash
sudo nano /etc/nginx/sites-available/auctionboard
```

Paste this config (replace `yourdomain.com` with your domain or EC2 IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase upload limit for player/team images
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;

        # Required for Socket.io WebSocket upgrade
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Keep WebSocket connections alive during auction
        proxy_read_timeout 86400;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/auctionboard /etc/nginx/sites-enabled/
sudo nginx -t          # should print "syntax is ok"
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Step 11 — (Recommended) Add SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y

# Replace with your actual domain (must have DNS pointing to this EC2 IP first)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-updates the Nginx config to handle HTTPS and redirects HTTP → HTTPS.

Set up auto-renewal:
```bash
sudo certbot renew --dry-run   # test renewal
# Renewal runs automatically via systemd timer — no cron needed
```

After SSL is set up, update your `.env`:
```env
CLIENT_URL=https://yourdomain.com
```

Then restart PM2:
```bash
pm2 restart auctionboard-server
```

---

### Step 12 — MongoDB Atlas network access

In Atlas dashboard → **Network Access → Add IP Address**:
- Add your EC2's **Public IPv4** (static Elastic IP recommended so it doesn't change on reboot)
- Or add `0.0.0.0/0` temporarily for testing (remove after)

---

## Updating the deployment

```bash
cd ~/AuctionBoard

git pull

# Rebuild client if frontend changed
cd client && npm install && npm run build && cd ..

# Install any new server deps
cd server && npm install --omit=dev && cd ..

# Restart server
pm2 restart auctionboard-server

pm2 logs auctionboard-server   # watch logs
```

---

## Useful PM2 commands

```bash
pm2 status                        # process list
pm2 logs auctionboard-server      # live logs
pm2 logs auctionboard-server --lines 100  # last 100 lines
pm2 restart auctionboard-server   # restart after code change
pm2 stop auctionboard-server      # stop
pm2 delete auctionboard-server    # remove from PM2
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `502 Bad Gateway` | PM2 process crashed — run `pm2 logs` |
| WebSockets not connecting | Nginx missing `Upgrade`/`Connection` headers — verify the proxy config |
| `CORS error` in browser | `CLIENT_URL` in `.env` doesn't match the actual URL the browser uses |
| Atlas connection refused | EC2 IP not in Atlas Network Access allowlist |
| Images not loading | `server/uploads/` permissions — run `chmod 755 ~/AuctionBoard/server/uploads` |
