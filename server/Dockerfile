# ===== Multi-stage build for production-ready backend =====
# Stage 1: Build/Dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files for parent dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# ===== Stage 2: Production runtime =====
FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Install curl for health checks (very small in Alpine)
RUN apk add --no-cache curl

# Copy only node_modules from builder stage
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy package.json for reference
COPY --chown=appuser:nodejs package.json .

# Copy server source code
COPY --chown=appuser:nodejs server/ ./server/

# Copy dist directory if available (for serving static files)
COPY --chown=appuser:nodejs dist/ ./dist/ 2>/dev/null || true

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "server/server.js"]
