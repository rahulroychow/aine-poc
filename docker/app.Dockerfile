# Frontend: React + Vite static bundle served by `serve`.
# Build context is the repo root — see docker/compose.yml.

# ---- Stage 1: build the static bundle ----
FROM node:22-alpine AS builder

WORKDIR /app

# npm 10 (bundled with node 22) misreads lockfiles written by npm 11 —
# it treats platform-specific optional deps as hard requirements and
# fails with EBADPLATFORM. Match the npm major that wrote the lockfile.
RUN npm install -g npm@11

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:22-alpine

WORKDIR /app

# curl is required by the HEALTHCHECK below; node:22-alpine does not ship it.
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
