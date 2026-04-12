# Running AuctionBoard Locally

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| MongoDB | Local or Atlas free cluster | https://mongodb.com/atlas |

That's it. No cloud accounts needed for local dev.

---

## 1. MongoDB

**Option A — Local MongoDB (quickest)**
```bash
# macOS with Homebrew
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
# Connection string: mongodb://localhost:27017/auctionboard
```

**Option B — MongoDB Atlas (free tier)**
1. Create free cluster at mongodb.com/atlas
2. Whitelist your IP → Get connection string
3. Paste it into `server/.env` as `MONGO_URI`

---

## 2. Environment File

```bash
cp server/.env.example server/.env
```

Then open `server/.env` and set:

```env
MONGO_URI=mongodb://localhost:27017/auctionboard   # or your Atlas URI
JWT_SECRET=any-long-random-string-here
STORAGE_BACKEND=local   # images save to /server/uploads/ — no cloud needed
```

Everything else can stay as-is for local dev.

---

## 3. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

---

## 4. Run

Open **two terminals**:

```bash
# Terminal 1 — API server (port 8000)
cd server && npm run dev

# Terminal 2 — React app (port 5173)
cd client && npm run dev
```

Open: **http://localhost:5173**

---

## 5. Create Your First Admin Account

The app has no seed data. Register an admin via the API once the server is running:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"password123","role":"admin"}'
```

Then log in at http://localhost:5173/login with those credentials.

---

## 6. Quick Start Flow

Once logged in as admin:

1. **Dashboard** → Create a new auction
2. **Config** → Set purse, squad rules, bid increments, player roles
3. **Teams** → Add teams (optionally assign owner users)
4. **Players** → Add players manually or import via CSV (download template first)
5. **Live Room** → Start auction → Next Player → teams bid → Sold/Unsold

To test as a team owner, register a second account with `"role":"team_owner"` and link it to a team by passing `"teamId":"<team_id>"`.

---

## Folder Structure (quick reference)

```
AuctionBoard/
├── client/       # React app (Vite, port 5173)
├── server/       # Express API + Socket.io (port 8000)
│   ├── .env      # your local config (never commit this)
│   └── uploads/  # local image storage (auto-created)
```
