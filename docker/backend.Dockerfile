# Backend Dockerfile for NestJS + TypeScript + Prisma stack
# Multi-stage build for optimized production image

# Base stage with common dependencies
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Dependencies stage
FROM base AS dependencies

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install all dependencies (including dev dependencies for building)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema for generation
COPY packages/database/prisma ./packages/database/prisma/

# Generate Prisma client
RUN pnpm run db:generate

# Build stage
FROM dependencies AS builder

# Copy source code
COPY . .

# Build arguments for environment configuration
ARG NODE_ENV=production
ARG DATABASE_URL
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG REDIS_URL

# Set build environment variables
ENV NODE_ENV=$NODE_ENV

# Run type checking
RUN pnpm run type-check:backend

# Build the backend application
RUN pnpm run build:backend

# Remove dev dependencies
RUN pnpm prune --prod

# Production stage
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application and production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Copy Prisma files for migrations
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/prisma ./packages/database/prisma/

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nestjs:nodejs /app/logs /app/uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "apps/backend/dist/main.js"]

# Development stage
FROM dependencies AS development

# Set development environment
ENV NODE_ENV=development
ENV PORT=3000

# Copy source code
COPY . .

# Switch to non-root user
USER nestjs

# Expose port and debug port
EXPOSE 3000 9229

# Development command with hot reload
CMD ["pnpm", "run", "start:dev"]

# Testing stage
FROM dependencies AS testing

# Copy source code
COPY . .

# Run linting
RUN pnpm run lint:backend

# Run type checking
RUN pnpm run type-check:backend

# Run tests
RUN pnpm run test:backend

# Run e2e tests
RUN pnpm run test:e2e:backend

# Migration stage (for running migrations)
FROM base AS migration

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/

# Install only necessary dependencies for migrations
RUN pnpm install --prod --frozen-lockfile

# Copy Prisma files
COPY packages/database/prisma ./packages/database/prisma/

# Generate Prisma client
RUN pnpm run db:generate

# Switch to non-root user
USER nestjs

# Migration command
CMD ["pnpm", "run", "db:migrate:deploy"]

# Seed stage (for seeding database)
FROM migration AS seed

# Copy seed files
COPY --chown=nestjs:nodejs packages/database/seeds ./packages/database/seeds/

# Seed command
CMD ["pnpm", "run", "db:seed"]

# Debug stage (for debugging in production)
FROM production AS debug

# Switch back to root to install debug tools
USER root

# Install debug tools
RUN apk add --no-cache \
    htop \
    strace \
    tcpdump \
    && rm -rf /var/cache/apk/*

# Switch back to non-root user
USER nestjs

# Expose debug port
EXPOSE 9229

# Debug command
CMD ["dumb-init", "node", "--inspect=0.0.0.0:9229", "apps/backend/dist/main.js"]

# Production with monitoring stage
FROM production AS production-monitoring

# Switch to root to install monitoring tools
USER root

# Install monitoring and logging tools
RUN apk add --no-cache \
    curl \
    jq \
    && rm -rf /var/cache/apk/*

# Copy monitoring scripts
COPY docker/scripts/health-check.sh /usr/local/bin/
COPY docker/scripts/metrics.sh /usr/local/bin/

# Make scripts executable
RUN chmod +x /usr/local/bin/health-check.sh /usr/local/bin/metrics.sh

# Switch back to non-root user
USER nestjs

# Enhanced health check with custom script
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Start with monitoring
CMD ["dumb-init", "node", "apps/backend/dist/main.js"]

# SSL/TLS stage (for HTTPS in production)
FROM production AS production-ssl

USER root

# Install SSL certificates and tools
RUN apk add --no-cache \
    ca-certificates \
    openssl \
    && rm -rf /var/cache/apk/*

# Create SSL directory
RUN mkdir -p /app/ssl && \
    chown -R nestjs:nodejs /app/ssl

USER nestjs

# Expose HTTPS port
EXPOSE 3000 3443

# Start with SSL support
CMD ["dumb-init", "node", "apps/backend/dist/main.js"]