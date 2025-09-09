# Frontend Dockerfile for Vue.js + Vite + pnpm stack
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files for dependency installation
# This layer will be cached unless package files change
COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment configuration
ARG NODE_ENV=production
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_AUTH_URL

# Set environment variables
ENV NODE_ENV=$NODE_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_AUTH_URL=$VITE_AUTH_URL

# Build the frontend application
RUN pnpm run build:frontend

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx configurations for Vue Router (SPA)
COPY docker/nginx/spa.conf /etc/nginx/conf.d/spa.conf

# Create nginx user and set permissions
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage (for docker-compose.dev.yml)
FROM node:18-alpine AS development

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies)
RUN pnpm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Development command
CMD ["pnpm", "run", "dev:frontend"]

# Build stage for testing
FROM builder AS testing

# Run linting and type checking
RUN pnpm run lint:frontend
RUN pnpm run type-check:frontend

# Run tests
RUN pnpm run test:frontend

# Export test results (optional)
# COPY --from=testing /app/apps/frontend/coverage /tmp/coverage