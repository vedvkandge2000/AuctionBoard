# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Run both servers in separate terminals:**
```bash
# Terminal 1 — Express API + Socket.io (port 8000)
cd server && npm run dev        # uses nodemon

# Terminal 2 — Vite React client (port 5173)
cd client && npm run dev
```

**Other client commands:**
```bash
cd client && npm run build      # production build → client/dist/
cd client && npm run lint       # ESLint
cd client && npm run preview    # preview production build locally
```

**Production mode (serves React from Express):**
```bash
cd client && npm run build
cd server && NODE_ENV=production npm start   # serves client/dist at /
```

**Setup:**
```bash
cp server/.env.example server/.env   # fill in MONGO_URI and JWT_SECRET
cd server && npm install
cd client && npm install
```

## Architecture Overview

### Two-process dev setup
In development, Vite (`localhost:5173`) and Express (`localhost:8000`) run as separate processes. Vite proxies `/api` and `/socket.io` to Express via `client/vite.config.js`. In production, Express serves the built `client/dist/` directly.

### Auth flow
JWT is issued on login and stored in `localStorage`. The Axios instance in `client/src/services/api.js` attaches it as a `Bearer` header on every request. For sockets, the token is passed via `socket.handshake.auth.token` and decoded in the Socket.io middleware in `server/src/socket/auctionHandlers.js`. The decoded payload (`{ id, role, teamId }`) is available as `req.user` (REST) or `socket.user` (sockets).

### Role system
Three roles: `admin`, `team_owner`, `viewer`. Enforced server-side via `requireRole(...roles)` middleware (`server/src/middleware/role.middleware.js`). Team owners have an additional `approvalStatus` field (`pending` → `approved`) — pending accounts are blocked at login in `auth.controller.js`.

### Real-time auction state
The auction state machine lives in `server/src/services/auctionEngine.js`. All state transitions (start/pause/next-player/sold/unsold/bid) happen there and immediately emit Socket.io events to the `auction:<id>` room. The client's `AuctionContext` (`client/src/context/AuctionContext.jsx`) maintains the live state via a reducer driven by these socket events. **Bid validation is entirely server-side** — the client sends a bid amount, the server validates it and rejects or broadcasts.

### Bid increment tiers
`calcNextBid()` in `server/src/utils/bidIncrementCalc.js` determines the exact next valid bid given the current amount and the auction's `bidIncrementTiers` array. The client must send exactly this amount — arbitrary amounts are rejected. The same utility is available client-side in `client/src/utils/calcBidIncrement.js`.

### Player registration flow
Players self-register via `POST /api/register/player` → creates a `PlayerRegistration` document (pending). Admin approves via `POST /api/admin/players/:id/approve` with `{ auctionId }`, which creates the actual `Player` document. Similarly, team owners self-register via `POST /api/register/team-owner` with `approvalStatus: 'pending'` and need admin approval before they can log in.

### Team ownership
One team owner can own at most one team per auction. Enforced by a unique sparse compound index on `Team({ auctionId, ownerId })`. When a team_owner calls `POST /api/auctions/:id/teams`, `ownerId` is set automatically to `req.user.id` — the request body's `ownerId` field is ignored for non-admins. After team creation, `User.teamId` is updated to link the user to their team.

### Image uploads
`server/src/services/uploadService.js` abstracts local vs. Cloudinary storage behind a single `uploadFile(file, folder)` function. Set `STORAGE_BACKEND=local` (default, stores in `server/uploads/`) or `STORAGE_BACKEND=cloudinary` with Cloudinary credentials. Images are resized to 400×400 WebP via Sharp before storage.

### Key server structure
- `server/index.js` — entry point; creates HTTP server, attaches Socket.io, connects MongoDB, starts listening
- `server/src/app.js` — Express app; mounts all routes; serves `client/dist/` when `NODE_ENV !== 'development'`
- `server/src/config/socket.js` — Socket.io server init; exposes `getIO()` for use in services
- `server/src/services/auctionEngine.js` — all auction state transitions and bid logic; calls `getIO()` directly to emit events
- `server/src/services/rtmService.js` — RTM window open/expire/response logic (lazily required in auctionEngine to avoid circular deps)

### Key client structure
- `client/src/context/AuthContext.jsx` — JWT persistence, `isAdmin`, `isTeamOwner`, `isPendingApproval` flags
- `client/src/context/AuctionContext.jsx` — live auction state reducer wired to socket events
- `client/src/services/api.js` — Axios instance with auth interceptor (base URL `/api`)
- All API calls live in `client/src/services/` — never fetch directly inside components

### Common gotcha
Never define React components inside another component's render function — it causes remounting on every state change (focus loss in inputs). All sub-components must be defined at module scope.
