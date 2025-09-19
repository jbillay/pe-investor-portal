# RBAC Setup Guide for Investor Portal

This guide explains how to set up the Role-Based Access Control (RBAC) system for the investor portal using the provided API endpoints.

## Overview

The RBAC system includes:
- **6 predefined roles** with different access levels
- **50+ granular permissions** across all system resources
- **Automatic role assignment** for new users
- **Permission inheritance** through role hierarchy
- **Audit trails** for all role and permission changes

## Roles Hierarchy

### 1. SUPER_ADMIN
- **Purpose**: System administrators with full access
- **Access**: All features, user management, system configuration
- **Use Case**: IT administrators, system maintainers

### 2. FUND_MANAGER
- **Purpose**: Fund management team with operational access
- **Access**: Fund operations, investor management, performance tracking
- **Use Case**: GP team, portfolio managers, fund operations

### 3. COMPLIANCE_OFFICER
- **Purpose**: Compliance and regulatory oversight
- **Access**: All data for compliance reporting, audit trails
- **Use Case**: Compliance team, regulatory reporting

### 4. ANALYST
- **Purpose**: Read-only access for analysis and reporting
- **Access**: Performance data, reports, analytics
- **Use Case**: Research analysts, performance analysts

### 5. INVESTOR (Default Role)
- **Purpose**: Limited partners with access to their investments
- **Access**: Own investments, documents, communications
- **Use Case**: LP investors, fund investors

### 6. VIEWER
- **Purpose**: Minimum access for basic information
- **Access**: Public documents, basic fund information
- **Use Case**: Prospective investors, external advisors

## Permission Categories

### User Management
- `USER:CREATE` - Create new users
- `USER:READ` - View user information
- `USER:UPDATE` - Update user details
- `USER:DELETE` - Delete/deactivate users
- `USER:MANAGE_ROLES` - Assign/revoke roles

### Fund Management
- `FUND:CREATE` - Create new funds
- `FUND:READ` - View fund information
- `FUND:UPDATE` - Update fund details
- `FUND:DELETE` - Delete funds
- `FUND:MANAGE_PERFORMANCE` - Update performance metrics

### Investment Management
- `INVESTMENT:CREATE` - Create investments
- `INVESTMENT:READ` - View all investments
- `INVESTMENT:UPDATE` - Update investment details
- `INVESTMENT:DELETE` - Delete investments
- `INVESTMENT:READ_OWN` - View own investments only

### Capital Activity
- `CAPITAL_CALL:CREATE` - Create capital calls
- `CAPITAL_CALL:READ` - View capital calls
- `CAPITAL_CALL:UPDATE` - Update capital calls
- `CAPITAL_CALL:PROCESS` - Process payments

- `DISTRIBUTION:CREATE` - Create distributions
- `DISTRIBUTION:READ` - View distributions
- `DISTRIBUTION:UPDATE` - Update distributions
- `DISTRIBUTION:PROCESS` - Process payments

### Document Management
- `DOCUMENT:CREATE` - Upload documents
- `DOCUMENT:READ` - View documents
- `DOCUMENT:UPDATE` - Update document metadata
- `DOCUMENT:DELETE` - Delete documents
- `DOCUMENT:READ_CONFIDENTIAL` - Access confidential documents

### Reporting
- `REPORT:GENERATE` - Generate reports
- `REPORT:VIEW_PERFORMANCE` - View performance reports
- `REPORT:VIEW_COMPLIANCE` - View compliance reports
- `REPORT:EXPORT` - Export data

### System & Audit
- `SYSTEM:CONFIGURE` - Configure system settings
- `SYSTEM:MONITOR` - Monitor system health
- `AUDIT:READ` - View audit logs
- `AUDIT:EXPORT` - Export audit data

## API Endpoints for RBAC Setup

### 1. Initialize Complete RBAC System

```bash
POST /api/rbac-setup/initialize
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "permissionsCreated": 50,
  "rolesCreated": 6,
  "rolePermissionsAssigned": 180,
  "message": "RBAC system initialized successfully..."
}
```

This single endpoint will:
- Create all 50+ permissions
- Create all 6 roles
- Assign appropriate permissions to each role
- Set INVESTOR as the default role for new users

### 2. Create Permissions Only

```bash
POST /api/rbac-setup/create-permissions
Authorization: Bearer <super_admin_token>
```

### 3. Create Roles Only

```bash
POST /api/rbac-setup/create-roles
Authorization: Bearer <super_admin_token>
```

### 4. Assign Permissions to Roles

```bash
POST /api/rbac-setup/assign-permissions
Authorization: Bearer <super_admin_token>
```

## User Role Management

### Assign Role to User

```bash
POST /api/user-roles/assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "roleName": "FUND_MANAGER",
  "reason": "Promoted to fund management team"
}
```

### Bulk Role Assignment

```bash
POST /api/user-roles/bulk-assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "assignments": [
    {
      "userId": "user-1",
      "roleName": "INVESTOR",
      "reason": "New investor onboarding"
    },
    {
      "userId": "user-2",
      "roleName": "ANALYST",
      "reason": "Research team member"
    }
  ]
}
```

### Initialize User Permissions (First Login)

```bash
POST /api/user-roles/initialize/me
Authorization: Bearer <user_token>
```

### Check User Access

```bash
POST /api/user-roles/check-access/me
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "resource": "FUND",
  "action": "READ"
}
```

**Response:**
```json
{
  "hasAccess": true,
  "permissions": ["FUND:READ", "INVESTMENT:READ_OWN", ...],
  "roles": ["INVESTOR"]
}
```

### Get User's Effective Permissions

```bash
GET /api/user-roles/effective-permissions/me
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "userId": "user-uuid",
  "roles": ["INVESTOR"],
  "permissions": ["INVESTMENT:READ_OWN", "DOCUMENT:READ", ...],
  "resourcePermissions": {
    "INVESTMENT": ["READ_OWN"],
    "DOCUMENT": ["READ"],
    "CAPITAL_CALL": ["READ"],
    "DISTRIBUTION": ["READ"]
  }
}
```

## Setup Process

### 1. System Initialization (One-time setup)

```bash
# 1. Initialize the complete RBAC system
curl -X POST "http://localhost:3000/api/rbac-setup/initialize" \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json"
```

### 2. User Onboarding Process

For each new user:

```bash
# 1. User registers or is created
POST /api/auth/register

# 2. Initialize their default permissions (INVESTOR role)
POST /api/user-roles/initialize/me

# 3. Check their effective permissions
GET /api/user-roles/effective-permissions/me

# 4. If needed, promote to a higher role
POST /api/user-roles/assign
{
  "userId": "new-user-id",
  "roleName": "FUND_MANAGER",
  "reason": "Joining fund management team"
}
```

### 3. Permission Verification

Before accessing any protected resource:

```bash
POST /api/user-roles/check-access/me
{
  "resource": "FUND",
  "action": "CREATE"
}
```

## Role Permission Matrix

| Role | Users | Funds | Investments | Capital Activity | Documents | Reports | System |
|------|--------|-------|-------------|------------------|-----------|---------|---------|
| SUPER_ADMIN | All | All | All | All | All | All | All |
| FUND_MANAGER | Read/Update | All except Delete | All | All | All | Performance/Export | Monitor |
| COMPLIANCE_OFFICER | Read | Read | Read | Read | All + Confidential | All | Audit |
| ANALYST | - | Read | Read | Read | Read | Performance | - |
| INVESTOR | - | Read | Own Only | Own Only | Read | Performance | - |
| VIEWER | - | Read | - | - | Read | - | - |

## Frontend Integration

Use the permission checking in your Vue.js components:

```javascript
// composables/usePermissions.js
export function usePermissions() {
  const checkAccess = async (resource, action) => {
    const response = await apiClient.post('/user-roles/check-access/me', {
      resource,
      action
    });
    return response.data.hasAccess;
  };

  return { checkAccess };
}

// In Vue component
const { checkAccess } = usePermissions();

// Show/hide UI elements based on permissions
const canCreateFund = await checkAccess('FUND', 'CREATE');
const canViewReports = await checkAccess('REPORT', 'VIEW_PERFORMANCE');
```

## Security Best Practices

1. **Always check permissions** on both frontend and backend
2. **Use specific permissions** instead of checking roles directly
3. **Audit role changes** with proper logging
4. **Regular permission reviews** for users with elevated access
5. **Principle of least privilege** - assign minimum required permissions
6. **Secure role assignment** - only admins can assign sensitive roles

## Monitoring and Maintenance

### Check System Health

```bash
GET /api/roles
GET /api/permissions
GET /api/roles/user/:userId
```

### Audit Role Changes

```bash
GET /api/roles/history/:userId
```

### Clean Up Test Data

```bash
DELETE /api/user-roles/remove-all/:userId
```

This RBAC system provides a robust, scalable foundation for managing access control in your investor portal while maintaining security and compliance with PE/VC industry standards.

## Common Use Cases

### 1. New Investor Registration
- User registers → Gets INVESTOR role automatically
- Can view their own investments and documents
- Cannot see other investors' data

### 2. Fund Manager Onboarding
- Admin assigns FUND_MANAGER role
- Gets access to create/update funds
- Can manage all investments and capital activity

### 3. Compliance Review
- Compliance officer has read access to all data
- Can generate compliance reports
- Has access to audit trails

### 4. System Administration
- Super admin can manage all users and roles
- Can configure system settings
- Has backup and monitoring capabilities

This comprehensive RBAC system ensures proper data separation, compliance with industry regulations, and scalable permission management as your investor portal grows.