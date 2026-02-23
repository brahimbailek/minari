# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for bcrypt native compilation
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/auth-service ./apps/auth-service

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Generate Prisma Client (dummy URL for build-time generation only)
RUN cd packages/database && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build packages with turbo
RUN npx turbo run build --filter=@commpro/shared
RUN npx turbo run build --filter=@commpro/auth-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime deps for bcrypt
RUN apk add --no-cache libstdc++

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Copy all node_modules (includes Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/package.json
COPY --from=builder /app/apps/auth-service/node_modules ./apps/auth-service/node_modules

# Expose port
EXPOSE ${PORT:-3001}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
WORKDIR /app/apps/auth-service
CMD ["node", "dist/index.js"]
