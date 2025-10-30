# Multi-stage build for optimized production image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build tools)
RUN npm ci

# Copy source code
COPY . .

# Build frontend with Vite
RUN npm run build

# Build backend production server with esbuild
RUN npx esbuild server/production.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/production.js

# Verify production.js was created
RUN ls -lh dist/ && \
    if [ ! -f dist/production.js ]; then \
      echo "ERROR: dist/production.js not created!" && exit 1; \
    fi

# Production stage (smaller final image)
FROM node:20-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Set environment
ENV NODE_ENV=production

# Expose port (Railway auto-detects from PORT env var)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start production server
CMD ["node", "dist/production.js"]