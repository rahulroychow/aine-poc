# Backend: Express API exposing the health endpoints.
# Build context is the repo root — see docker/compose.yml.

# ---- Stage 1: production dependencies ----
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime ----
FROM node:18-alpine

WORKDIR /app

# curl is required by the HEALTHCHECK below; node:18-alpine does not ship it.
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
