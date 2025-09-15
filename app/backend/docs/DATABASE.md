# Database Schema Documentation

## Overview

The PE Investor Portal uses PostgreSQL with Prisma ORM to provide type-safe database operations, automated migrations, and comprehensive data modeling. The current implementation focuses on single-tenant architecture with user authentication and session management.

## Database Configuration

### Connection Details

- **Database Engine**: PostgreSQL 15+
- **ORM**: Prisma 6+
- **Connection Pooling**: Built-in Prisma connection pooling
- **Migration System**: Prisma Migrate
- **Admin Interface**: Prisma Studio

### Environment Configuration

```bash
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/pe_portal?schema=public"

# Connection pool settings (optional)
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30000
```

## Schema Overview

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        boolean isActive
        boolean isVerified
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
    }

    UserProfile {
        string id PK
        string userId UK,FK
        string phone
        string avatar
        string timezone
        string language
        json preferences
    }

    Session {
        string id PK
        string userId FK
        string refreshToken UK
        boolean isRevoked
        datetime expiresAt
        string userAgent
        string ipAddress
        datetime createdAt
        datetime updatedAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string resource
        json details
        string ipAddress
        string userAgent
        datetime createdAt
    }

    User ||--|| UserProfile : "has one"
    User ||--o{ Session : "has many"
    User ||--o{ AuditLog : "generates"
```

## Table Definitions

### User

User account for authentication and profile management.

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMP(3),
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);
```

**Columns:**
- `id`: Primary key (CUID)
- `email`: User email address (unique globally)
- `password`: Bcrypt hashed password
- `firstName/lastName`: User name components
- `isActive`: Account status flag
- `isVerified`: Email verification status
- `lastLogin`: Last successful authentication
- `createdAt/updatedAt`: Audit timestamps

**Business Rules:**
- Email must be unique globally
- Inactive users cannot authenticate
- Password is hashed with bcrypt (12 rounds)
- Auto-generated CUID for primary key

### UserProfile

Extended user information and preferences.

```sql
CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    language TEXT NOT NULL DEFAULT 'en',
    preferences JSONB,
    
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;
```

**Columns:**
- `id`: Primary key (CUID)
- `userId`: One-to-one relationship with User
- `phone`: Optional phone number
- `avatar`: Profile image URL/path
- `timezone`: User timezone (default: UTC)
- `language`: Preferred language (default: en)
- `preferences`: JSON object for user preferences

**Business Rules:**
- One profile per user (enforced by unique constraint)
- Preferences stored as flexible JSON structure
- Timezone affects date/time displays
- Cascade deletion with user account

### Session

Refresh token and session management.

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    refresh_token TEXT NOT NULL UNIQUE,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP(3) NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_revoked, expires_at);
```

**Columns:**
- `id`: Primary key (CUID)
- `userId`: Foreign key to user
- `refreshToken`: Unique JWT refresh token
- `isRevoked`: Session revocation flag
- `expiresAt`: Token expiration timestamp
- `userAgent`: Client user agent string
- `ipAddress`: Client IP address
- `createdAt/updatedAt`: Audit timestamps

**Business Rules:**
- Refresh token must be globally unique
- Expired sessions are periodically cleaned up
- Revoked sessions cannot be used for refresh
- Multiple sessions per user allowed
- Cascade deletion when user is deleted

### AuditLog

Complete audit trail for security and compliance.

```sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_composite ON audit_logs(user_id, action, created_at);
```

**Columns:**
- `id`: Primary key (CUID)
- `userId`: Optional user ID (for user actions)
- `action`: Action type (LOGIN, LOGOUT, REGISTER, etc.)
- `resource`: Affected resource type (AUTH, USER, etc.)
- `details`: JSON object with action details
- `ipAddress`: Client IP address
- `userAgent`: Client user agent
- `createdAt`: Event timestamp

**Business Rules:**
- Immutable records (no updates/deletes)
- Supports both user and system actions
- Flexible JSON details for different event types
- Used for security monitoring and compliance

## Relationships

### One-to-Many Relationships

1. **User → Sessions**: One user can have multiple sessions (multi-device support)
2. **User → AuditLogs**: One user generates many audit logs

### One-to-One Relationships

1. **User ↔ UserProfile**: Each user has exactly one profile

### Foreign Key Constraints

All foreign keys include `ON DELETE CASCADE` to maintain referential integrity:

- Deleting a user removes their profile, sessions, and audit logs
- Orphaned records are prevented by database constraints

## Indexes and Performance

### Primary Indexes

- All tables have primary key indexes on `id` field
- Unique constraints create automatic indexes

### Secondary Indexes

#### Users Table
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);
```

#### Sessions Table
```sql
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_active ON sessions(is_revoked, expires_at);
```

#### Audit Logs Table
```sql
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_composite ON audit_logs(tenant_id, user_id, action, created_at);
```

### Query Optimization

#### Common Query Patterns

1. **User Authentication**:
   ```sql
   SELECT u.*, t.* FROM users u 
   JOIN tenants t ON u.tenant_id = t.id 
   WHERE u.email = ? AND u.is_active = true AND t.is_active = true;
   ```

2. **Session Validation**:
   ```sql
   SELECT * FROM sessions 
   WHERE refresh_token = ? AND is_revoked = false AND expires_at > NOW();
   ```

3. **Audit Trail Query**:
   ```sql
   SELECT * FROM audit_logs 
   WHERE tenant_id = ? AND user_id = ? AND created_at >= ? 
   ORDER BY created_at DESC;
   ```

## Data Types and Constraints

### String Fields

- **ID Fields**: TEXT with CUID format (`cljk0x5a10001qz6z9k8z9k8z`)
- **Email**: TEXT with email validation
- **Names**: TEXT, nullable for optional fields
- **Passwords**: TEXT, bcrypt hashed
- **Tokens**: TEXT, JWT format

### Boolean Fields

- Default values provided for all boolean fields
- NOT NULL constraints to prevent null states

### Timestamp Fields

- `TIMESTAMP(3)` for millisecond precision
- Automatic defaults for created_at fields
- Automatic updates for updated_at fields (via Prisma)

### JSON Fields

- `JSONB` type for structured data
- Used for user preferences and audit details
- Supports efficient querying and indexing

## Prisma Configuration

### Schema Location

The Prisma schema is located at `app/backend/prisma/schema.prisma` and includes:

- PostgreSQL database configuration
- User authentication models
- Session management tables
- Audit logging structures

### Generated Client

The Prisma client is generated to `app/backend/generated/prisma/` and provides:

- Type-safe database operations
- Auto-generated TypeScript interfaces
- Optimized queries with connection pooling
- Real-time database introspection

## Migrations

### Migration Strategy

Prisma migrations are used for schema changes:

```bash
# Generate Prisma client
pnpm run prisma:generate

# Create and apply migration
pnpm run prisma:migrate dev --name add_new_feature

# Apply migrations (production)
pnpm run prisma:migrate deploy

# Open Prisma Studio
pnpm run prisma:studio

# Reset database (development only)
pnpm run prisma:reset
```

### Migration Files

Located in `app/backend/prisma/migrations/`:

```
migrations/
├── 20250109000000_initial_setup/
│   └── migration.sql
├── 20250109000001_add_user_profiles/
│   └── migration.sql
└── migration_lock.toml
```

### Example Migration

```sql
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

## Backup and Recovery

### Backup Strategy

1. **Daily Full Backups**: Complete database backup
2. **Point-in-Time Recovery**: WAL archiving enabled
3. **Cross-Region Replication**: For disaster recovery

### Backup Commands

```bash
# Create backup
pg_dump -h localhost -U username -d pe_portal > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U username -d pe_portal < backup_20250109.sql

# Docker backup
docker exec -t postgres-container pg_dump -U username pe_portal > backup.sql
```

## Monitoring and Maintenance

### Performance Monitoring

Key metrics to monitor:

- Query execution times
- Index usage statistics
- Connection pool utilization
- Lock contention
- Table size growth

### Maintenance Tasks

#### Daily
- Monitor slow query log
- Check connection pool metrics
- Verify backup completion

#### Weekly
- Analyze query performance
- Review index usage
- Check table statistics

#### Monthly
- Update table statistics
- Review and optimize queries
- Plan for schema changes
- Audit security settings

### Useful Queries

#### Check Index Usage
```sql
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

#### Monitor Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Check Active Connections
```sql
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;
```

## Security Considerations

### Data Encryption

- **At Rest**: Database encryption enabled
- **In Transit**: SSL/TLS connections required
- **Application**: Sensitive fields hashed/encrypted

### Access Control

- **Database Users**: Principle of least privilege
- **Connection Limits**: Per-user connection limits
- **IP Restrictions**: Whitelist trusted networks
- **Audit Logging**: All DDL/DML operations logged

### Sensitive Data Handling

- **Passwords**: Never stored in plain text (bcrypt hashed)
- **Tokens**: Stored securely with expiration
- **PII**: Proper handling and retention policies
- **Audit Trails**: Immutable and comprehensive

## Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Test database connection
psql -h localhost -U username -d pe_portal -c "SELECT 1;"

# Check connection limits
SELECT * FROM pg_stat_activity WHERE datname = 'pe_portal';
```

#### Performance Issues
```bash
# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Analyze query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

#### Lock Issues
```bash
# Check for locks
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype;
```

### Recovery Procedures

#### Database Corruption
1. Stop application connections
2. Run database integrity checks
3. Restore from backup if necessary
4. Verify data consistency

#### Migration Failures
1. Review migration logs
2. Check for data conflicts
3. Manually resolve conflicts
4. Re-run migration

#### Performance Degradation
1. Identify slow queries
2. Check index usage
3. Update table statistics
4. Consider query optimization

## Future Enhancements

### Planned Features

1. **Partitioning**: Implement table partitioning for audit logs
2. **Read Replicas**: Set up read-only replicas for reporting
3. **Caching Layer**: Implement query result caching
4. **Full-Text Search**: Add search capabilities with indexes
5. **Data Archiving**: Implement data lifecycle management

### Schema Evolution

- **Version Control**: All schema changes tracked in git
- **Backward Compatibility**: Maintain API compatibility
- **Feature Flags**: Use feature flags for gradual rollout
- **Testing**: Comprehensive testing of schema changes