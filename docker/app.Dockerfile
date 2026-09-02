# Frontend: React + Vite static bundle served by `serve`.
# Build context is the repo root — see docker/compose.yml.

# ---- Stage 1: build the static bundle ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:18-alpine

WORKDIR /app

# curl is required by the HEALTHCHECK below; node:18-alpine does not ship it.
RUN apk add --no-cache curl && npm install -g serve@14

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:3000/ || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
