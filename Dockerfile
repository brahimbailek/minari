# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Build packages
RUN npm run build --filter=@commpro/shared --if-present
RUN npm run build --filter=@commpro/auth-service

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy all node_modules (includes Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/package.json

# Expose port
EXPOSE ${PORT:-3001}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
WORKDIR /app/apps/auth-service
CMD ["node", "dist/index.js"]
