# ===== Multi-stage build for production-ready frontend =====
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ===== Stage 2: Production runtime =====
FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Install serve to serve static files
RUN npm install -g serve

# Copy only the built assets from builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# Copy package.json for reference
COPY --chown=appuser:nodejs package.json .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
