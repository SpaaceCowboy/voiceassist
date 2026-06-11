# backend/Dockerfile — production image
# Multi-stage: install → build → slim runtime. Unlike Dockerfile.dev this ships
# only compiled output + prod deps, and (critically) copies the migrations/
# folder, which server.ts reads from process.cwd() on startup via runMigrations().

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies (full, for build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM deps AS builder
COPY . .
RUN npm run build

# ---- Production runtime ----
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000

# Production-only deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled app + migrations (runMigrations resolves ./migrations from cwd)
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations

EXPOSE 3000
CMD ["node", "dist/src/server.js"]
