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

> **Important:** The `.env` file must be created at **two locations** on the EC2 instance:
> - `~/AuctionBoard/server/.env` — used when running the server directly
> - `~/AuctionBoard/.env` — used by PM2 (it runs from the repo root, so `dotenv` resolves relative to there)
>
> The easiest approach is to create it once in `server/` then copy it to root (Step 8 below covers this).

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

# Set to your EC2 public IP or domain once DNS is configured
CLIENT_URL=http://<EC2-PUBLIC-IP>

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

### Step 2 — SSH into the instance

```bash
# Fix permissions on the key file (required on first use)
chmod 400 your-key.pem

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
git clone https://github.com/vedvkandge2000/AuctionBoard.git
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
cd ..
```

---

### Step 8 — Configure environment variables

```bash
cd ~/AuctionBoard/server
cp .env.example .env
nano .env
```

Fill in all values (Atlas URI, JWT secret, CLIENT_URL with your EC2 IP). Save with `Ctrl+O` → Enter → `Ctrl+X`.

**Then copy it to the repo root** — PM2 runs from there and dotenv resolves `.env` relative to the working directory:

```bash
cp ~/AuctionBoard/server/.env ~/AuctionBoard/.env
```

> Whenever you update `.env` in future, always update both files and run `pm2 restart auctionboard-server`.

---

### Step 9 — Start with PM2

```bash
cd ~/AuctionBoard

pm2 start ecosystem.config.js --env production
pm2 save

# Auto-start PM2 on server reboot
pm2 startup
# Copy and run the command it prints (starts with: sudo env PATH=...)
```

Verify the app is running:

```bash
pm2 status
# Status column should show "online", not "errored"

curl http://localhost:8000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

If status is `errored`, check logs immediately:

```bash
pm2 logs auctionboard-server --lines 50
```

Common causes: missing `.env` at repo root, wrong Atlas URI, Atlas IP not whitelisted.

---

### Step 10 — Configure Nginx as reverse proxy

```bash
sudo nano /etc/nginx/sites-available/auctionboard
```

Paste this config (replace the IP with your EC2 public IP or domain):

```nginx
server {
    listen 80;
    server_name <EC2-PUBLIC-IP>;

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
sudo nginx -t          # must print "syntax is ok"
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Then open `http://<EC2-PUBLIC-IP>` in your browser — the React app should load.

---

### Step 11 — MongoDB Atlas network access

In Atlas dashboard → **Network Access → Add IP Address**:
- Add your EC2's **Public IPv4** (Elastic IP recommended — regular EC2 IPs change on reboot)
- Or add `0.0.0.0/0` temporarily for testing (remove after)

---

### Step 12 — (Recommended) Add SSL with Let's Encrypt

Requires a domain name pointing to your EC2 IP first (set an A record in your DNS provider).

```bash
sudo apt install certbot python3-certbot-nginx -y

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-updates the Nginx config to handle HTTPS and redirects HTTP → HTTPS.

```bash
sudo certbot renew --dry-run   # test auto-renewal works
```

After SSL is set up, update both `.env` files:

```env
CLIENT_URL=https://yourdomain.com
```

```bash
pm2 restart auctionboard-server
```

---

## Redeploying new changes

Run these on the EC2 instance whenever you push new code.

### Backend-only changes (controllers, models, services)

```bash
cd ~/AuctionBoard
git pull
cd server && npm install --omit=dev && cd ..
pm2 restart auctionboard-server
pm2 logs auctionboard-server --lines 20
```

### Frontend-only changes (React components, pages, styles)

```bash
cd ~/AuctionBoard
git pull
cd client && npm install && npm run build && cd ..
pm2 restart auctionboard-server   # restarts Express so it serves the new build
```

### Both frontend and backend changed

```bash
cd ~/AuctionBoard
git pull
cd client && npm install && npm run build && cd ..
cd server && npm install --omit=dev && cd ..
pm2 restart auctionboard-server
pm2 logs auctionboard-server --lines 20
```

### Environment variable changed

```bash
nano ~/AuctionBoard/server/.env       # edit the value
cp ~/AuctionBoard/server/.env ~/AuctionBoard/.env   # sync to root
pm2 restart auctionboard-server
```

---

## Useful PM2 commands

```bash
pm2 status                                  # process list and health
pm2 logs auctionboard-server               # live log stream
pm2 logs auctionboard-server --lines 50    # last 50 lines
pm2 logs auctionboard-server --err         # errors only
pm2 restart auctionboard-server            # restart after code/env change
pm2 stop auctionboard-server               # stop without removing
pm2 delete auctionboard-server             # remove from PM2 entirely
pm2 save                                    # persist current process list across reboots
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| PM2 status `errored`, server won't start | `.env` missing at repo root | `cp server/.env .env` then `pm2 restart` |
| `injected env (0) from .env` in logs | `.env` at repo root is empty or missing | Same as above — check both `.env` files exist and have content |
| `502 Bad Gateway` in browser | PM2 process crashed | `pm2 logs` to find the error |
| `curl localhost:8000/api/health` fails | Server not running on port 8000 | `pm2 status` — if errored, fix `.env` and restart |
| WebSockets not connecting | Nginx missing upgrade headers | Verify Nginx config has `Upgrade` and `Connection` headers |
| `CORS error` in browser | `CLIENT_URL` doesn't match browser URL | Update `CLIENT_URL` in both `.env` files, restart PM2 |
| Browser can't reach EC2 IP at all | Port 80 not open in Security Group | AWS Console → EC2 → Security Group → add inbound rule port 80 |
| Atlas connection refused | EC2 IP not whitelisted | Atlas → Network Access → add EC2 public IP |
| Images not loading | Uploads folder permissions | `chmod 755 ~/AuctionBoard/server/uploads` |
