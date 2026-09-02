# Backend: Express API exposing the health endpoints.
# Build context is the repo root — see docker/compose.yml.

# ---- Stage 1: production dependencies ----
FROM node:22-alpine AS deps

WORKDIR /app

# npm 10 (bundled with node 22) misreads lockfiles written by npm 11 —
# it treats platform-specific optional deps as hard requirements and
# fails with EBADPLATFORM. Match the npm major that wrote the lockfile.
RUN npm install -g npm@11

COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime ----
FROM node:22-alpine

WORKDIR /app

# curl is required by the HEALTHCHECK below; node:22-alpine does not ship it.
RUN apk add --no-cache curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --chown=appuser:nodejs package.json ./
COPY --chown=appuser:nodejs server/ ./server/

USER appuser

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:5000/health || exit 1

CMD ["node", "server/server.js"]
