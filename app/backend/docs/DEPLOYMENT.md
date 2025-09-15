# Deployment Guide

## Overview

This guide covers deployment strategies for the PE Investor Portal backend API, including local development, staging, and production environments.

## Current Technology Stack

### Backend Technologies
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS (enterprise-grade with dependency injection)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh token rotation
- **API Documentation**: OpenAPI 3.0 / Swagger
- **Rate Limiting**: NestJS Throttler
- **Security**: Built-in security middleware and guards

### Development Tools
- **Package Manager**: pnpm (for faster installs and better dependency management)
- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: Prettier for formatting
- **Testing**: Jest framework for unit and e2e tests

## Quick Start

### Local Development

1. **Prerequisites**:
   ```bash
   # Required
   Node.js 18+ or 20+
   PostgreSQL 15+
   Redis 7+
   pnpm 8+
   
   # Optional
   Docker & Docker Compose
   ```

2. **Environment Setup**:
   ```bash
   # Clone and navigate
   cd app/backend
   
   # Install dependencies
   pnpm install

   # Configure environment
   cp .env.example .env
   # Edit .env with your configuration
   
   # Generate Prisma client
   pnpm run prisma:generate
   
   # Run migrations
   pnpm run prisma:migrate dev

   # Start development server
   pnpm run start:dev

   # The API will be available at http://localhost:3000
   # Swagger documentation at http://localhost:3000/api-docs
   ```

3. **Verify Installation**:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok","timestamp":"...","service":"pe-investor-portal-api","version":"1.0.0"}
   ```

### Docker Development

1. **Using Docker Compose**:
   ```bash
   # Start all services
   docker-compose -f docker-compose.dev.yml up -d
   
   # View logs
   docker-compose logs -f backend
   
   # Stop services
   docker-compose down
   ```

2. **Services Included**:
   - PostgreSQL database
   - Redis cache
   - pgAdmin (database management)
   - Redis Commander (cache management)

## Environment Configuration

### Environment Files

#### Development (.env)
```bash
# Application
NODE_ENV=development
APP_PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://myapp_user:password@localhost:5432/myapp?schema=public
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=development-jwt-secret-change-in-production
JWT_REFRESH_SECRET=development-refresh-secret-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

#### Production (.env.production)
```bash
# Application
NODE_ENV=production
APP_PORT=3000
FRONTEND_URL=https://app.pe-portal.com

# Database
DATABASE_URL=postgresql://prod_user:${DATABASE_PASSWORD}@db-cluster:5432/pe_portal?schema=public
REDIS_URL=redis://redis-cluster:6379

# JWT Authentication (Use secure random values)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# SSL/HTTPS
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Secret Management

#### Development
- Use `.env` file (not committed to git)
- Generate secure random secrets for JWT

#### Production
- Use environment-specific secret management:
  - **AWS**: AWS Secrets Manager
  - **Azure**: Azure Key Vault
  - **GCP**: Secret Manager
  - **Kubernetes**: Kubernetes Secrets
  - **Docker**: Docker Secrets

#### Generating Secure Secrets
```bash
# Generate 256-bit secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -base64 48  # Alternative format

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Docker Deployment

### Production Docker Build

#### Dockerfile Structure
```dockerfile
# Multi-stage build for optimization
FROM node:20-alpine AS base
# ... (see docker/backend.Dockerfile for complete implementation)

FROM base AS production
EXPOSE 3000
USER node
CMD ["node", "dist/main"]
```

#### Build Commands
```bash
# Build production image
docker build -f docker/backend.Dockerfile -t pe-portal-api:latest .

# Run container
docker run -d \
  --name pe-portal-api \
  --env-file .env.production \
  -p 3000:3000 \
  pe-portal-api:latest
```

### Docker Compose Production

#### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/backend.Dockerfile
      target: production
    environment:
      NODE_ENV: production
      # ... other environment variables
    volumes:
      - backend_uploads:/app/uploads
      - backend_logs:/app/logs
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pe_portal
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  backend_uploads:
  backend_logs:

networks:
  app_network:
    driver: bridge
```

#### Deployment Commands
```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update service
docker-compose -f docker-compose.prod.yml pull backend
docker-compose -f docker-compose.prod.yml up -d backend

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Cloud Deployment

### AWS Deployment

#### EC2 with Docker
```bash
# 1. Launch EC2 instance (t3.medium or larger)
# 2. Install Docker and Docker Compose
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Deploy application
git clone <your-repo>
cd pe-investor-portal
cp .env.production .env
docker-compose -f docker-compose.prod.yml up -d
```

#### ECS with Fargate
```json
{
  "family": "pe-portal-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "pe-portal-api",
      "image": "your-ecr-repo/pe-portal-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:pe-portal/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pe-portal-api",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Azure Deployment

#### Container Instances
```bash
# Create resource group
az group create --name pe-portal-rg --location eastus

# Create container instance
az container create \
  --resource-group pe-portal-rg \
  --name pe-portal-api \
  --image your-acr.azurecr.io/pe-portal-api:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server your-acr.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --dns-name-label pe-portal-api \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    APP_PORT=3000 \
  --secure-environment-variables \
    JWT_SECRET=<secret> \
    DATABASE_URL=<connection-string>
```

#### App Service
```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  dockerRegistryServiceConnection: 'your-acr-connection'
  imageRepository: 'pe-portal-api'
  containerRegistry: 'your-acr.azurecr.io'
  dockerfilePath: 'docker/backend.Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: Build and push stage
  jobs:
  - job: Build
    displayName: Build job
    steps:
    - task: Docker@2
      displayName: Build and push image
      inputs:
        command: buildAndPush
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest

- stage: Deploy
  displayName: Deploy stage
  dependsOn: Build
  jobs:
  - deployment: Deploy
    displayName: Deploy job
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebAppContainer@1
            displayName: 'Deploy to Azure Web App'
            inputs:
              azureSubscription: 'your-subscription'
              appName: 'pe-portal-api'
              containerImageName: '$(containerRegistry)/$(imageRepository):$(tag)'
```

### Google Cloud Platform

#### Cloud Run
```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT-ID/pe-portal-api

# Deploy to Cloud Run
gcloud run deploy pe-portal-api \
  --image gcr.io/PROJECT-ID/pe-portal-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1
```

#### GKE (Kubernetes)
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pe-portal-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pe-portal-api
  template:
    metadata:
      labels:
        app: pe-portal-api
    spec:
      containers:
      - name: api
        image: gcr.io/PROJECT-ID/pe-portal-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pe-portal-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: pe-portal-api-service
spec:
  selector:
    app: pe-portal-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Kubernetes Deployment

### Complete Kubernetes Configuration

#### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pe-portal
```

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pe-portal-config
  namespace: pe-portal
data:
  NODE_ENV: "production"
  APP_PORT: "3000"
  JWT_EXPIRATION: "15m"
  JWT_REFRESH_EXPIRATION: "7d"
  BCRYPT_ROUNDS: "12"
  THROTTLE_TTL: "60000"
  THROTTLE_LIMIT: "100"
```

#### Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pe-portal-secrets
  namespace: pe-portal
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  jwt-refresh-secret: <base64-encoded-secret>
  database-url: <base64-encoded-connection-string>
  redis-url: <base64-encoded-redis-url>
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pe-portal-api
  namespace: pe-portal
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: pe-portal-api
  template:
    metadata:
      labels:
        app: pe-portal-api
    spec:
      containers:
      - name: api
        image: pe-portal-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: pe-portal-config
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pe-portal-secrets
              key: jwt-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pe-portal-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 3
```

#### Service & Ingress
```yaml
apiVersion: v1
kind: Service
metadata:
  name: pe-portal-api-service
  namespace: pe-portal
spec:
  selector:
    app: pe-portal-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pe-portal-api-ingress
  namespace: pe-portal
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.pe-portal.com
    secretName: pe-portal-tls
  rules:
  - host: api.pe-portal.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pe-portal-api-service
            port:
              number: 80
```

## Database Setup

### Production Database Configuration

#### PostgreSQL Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE pe_portal;
CREATE USER pe_portal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE pe_portal TO pe_portal_user;
ALTER USER pe_portal_user CREATEDB;
EOF

# Configure PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: max_connections = 200
# Set: shared_buffers = 256MB
# Set: effective_cache_size = 1GB

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host pe_portal pe_portal_user 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### Migrations
```bash
# Run migrations in production
pnpm run prisma:migrate deploy

# Generate Prisma client
pnpm run prisma:generate
```

### Redis Setup

#### Redis Configuration
```bash
# Install Redis (Ubuntu/Debian)
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 512mb
# Set: maxmemory-policy allkeys-lru
# Set: save 900 1

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## SSL/HTTPS Configuration

### Let's Encrypt with Nginx

#### Install Certbot
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.pe-portal.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.pe-portal.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pe-portal.com;

    ssl_certificate /etc/letsencrypt/live/api.pe-portal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pe-portal.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

## Monitoring and Observability

### Health Checks

The API includes built-in health checks:

```bash
# Basic health check
curl https://api.pe-portal.com/health

# Response
{
  "status": "ok",
  "timestamp": "2025-01-09T10:30:00.000Z",
  "service": "pe-investor-portal-api",
  "version": "1.0.0"
}
```

### Logging Configuration

#### Application Logs
```typescript
// Structured logging configuration
const logger = new Logger('Application');

// Log levels by environment
const logLevels = {
  development: 'debug',
  staging: 'info',
  production: 'warn'
};
```

#### Log Aggregation
```yaml
# Filebeat configuration for ELK stack
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "pe-portal-logs-%{+yyyy.MM.dd}"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
```

### Metrics Collection

#### Prometheus Metrics
```typescript
// Custom metrics
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});

const authenticationAttempts = new Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method']
});
```

## Performance Optimization

### Application Performance

#### PM2 Configuration
```json
{
  "name": "pe-portal-api",
  "script": "dist/main.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 3000
  },
  "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
  "error_file": "/var/log/pe-portal/error.log",
  "out_file": "/var/log/pe-portal/out.log",
  "merge_logs": true,
  "max_memory_restart": "1G"
}
```

#### Database Optimization
```sql
-- Connection pooling
-- Set in DATABASE_URL: ?connection_limit=20&pool_timeout=60

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Update statistics
ANALYZE;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Caching Strategy

#### Redis Caching
```typescript
// Cache configuration
const redisConfig = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
};

// Cache patterns
await redis.setex('session:token', 3600, sessionData);
await redis.setex('user:profile:id', 300, userProfile);
```

## Security Hardening

### System Security

#### Firewall Configuration
```bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

#### System Updates
```bash
# Automated security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure automatic updates
echo 'Unattended-Upgrade::Automatic-Reboot "true";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

### Application Security

#### Security Headers
All security headers are automatically applied by the application middleware.

#### Rate Limiting
Configure rate limits based on your needs:

```typescript
// Custom rate limiting
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class ApiController {
  // Protected endpoints
}
```

## Backup and Disaster Recovery

### Database Backup

#### Automated Backups
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="pe_portal"

# Create backup
pg_dump -h localhost -U pe_portal_user $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud storage (AWS S3 example)
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz s3://pe-portal-backups/
```

#### Backup Schedule
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
gunzip backup_20250109_020000.sql.gz
psql -h localhost -U pe_portal_user -d pe_portal < backup_20250109_020000.sql
```

#### Application Recovery
```bash
# Quick recovery process
1. Stop application
2. Restore database
3. Update configuration
4. Start application
5. Verify functionality
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker logs pe-portal-api

# Common causes:
# - Database connection issues
# - Missing environment variables
# - Port conflicts
# - Permission issues
```

#### High Memory Usage
```bash
# Monitor memory
docker stats pe-portal-api

# Solutions:
# - Increase container memory limits
# - Optimize query patterns
# - Check for memory leaks
# - Restart application
```

#### Database Connection Issues
```bash
# Test connection
psql -h hostname -U username -d database_name

# Check connection limits
SELECT * FROM pg_stat_activity;

# Solutions:
# - Check firewall settings
# - Verify credentials
# - Check connection pool settings
# - Restart database service
```

### Performance Issues

#### Slow API Response
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/auth/profile"

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}s\n
#         time_connect:  %{time_connect}s\n
#      time_appconnect:  %{time_appconnect}s\n
#     time_pretransfer:  %{time_pretransfer}s\n
#        time_redirect:  %{time_redirect}s\n
#   time_starttransfer:  %{time_starttransfer}s\n
#                     ----------\n
#           time_total:  %{time_total}s\n
```

#### Database Performance
```sql
-- Check slow queries
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check application health endpoints
- [ ] Monitor error logs
- [ ] Verify backup completion
- [ ] Check disk space usage

#### Weekly
- [ ] Review application metrics
- [ ] Analyze slow query logs
- [ ] Check security updates
- [ ] Review audit logs

#### Monthly
- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Analyze performance trends
- [ ] Plan capacity adjustments
- [ ] Security assessment

### Update Procedures

#### Application Updates
```bash
# Zero-downtime deployment
1. Build new image
2. Test in staging
3. Rolling update in production
4. Verify functionality
5. Rollback if needed

# Example with Docker
docker-compose pull
docker-compose up -d --no-deps backend
```

#### Database Migrations
```bash
# Run migrations
pnpm run prisma:migrate deploy

# Verify migration
pnpm run prisma:migrate status
```

This completes the comprehensive deployment guide. The documentation covers all major deployment scenarios, from local development to production cloud environments, with detailed configuration examples and troubleshooting procedures.