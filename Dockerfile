# ── Stage 1: Build React client ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source
COPY server/ ./server/

# Copy built client from stage 1
COPY --from=build /app/client/dist ./client/dist

# Create uploads directory for local file storage
RUN mkdir -p server/uploads

EXPOSE 8000

ENV NODE_ENV=production

CMD ["node", "server/index.js"]
