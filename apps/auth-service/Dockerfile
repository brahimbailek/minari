# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service

# Install dependencies
RUN npm ci

# Build database package first
WORKDIR /app/packages/database
RUN npm run build

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build auth service
WORKDIR /app/apps/auth-service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy built packages
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Copy built auth service
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/

# Copy Prisma schema for runtime
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Expose port (Railway assigns this automatically)
EXPOSE ${PORT:-3001}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
WORKDIR /app/apps/auth-service
CMD ["node", "dist/index.js"]
