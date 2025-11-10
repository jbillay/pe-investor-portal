# Admin Components Testing Guide

## Overview

This document provides comprehensive testing guidance for all 18 admin components in the PE Investor Portal. The goal is to achieve **80%+ code coverage** for all admin components while ensuring tests are meaningful, maintainable, and follow best practices.

## Test Files Created

### ✅ Completed Test Files (4/18)

1. **UserCreateDialog.spec.ts** (50+ tests)
   - Component rendering
   - Form validation (email, names, required fields)
   - User creation workflows
   - Dialog interactions
   - Role selection
   - Edge cases and accessibility

2. **AdminNavigation.spec.ts** (35+ tests)
   - Navigation rendering
   - Route navigation behavior
   - Active state management
   - Styling and accessibility
   - Responsive behavior

3. **RoleDetailsDialog.spec.ts** (35+ tests)
   - Dialog rendering
   - Permissions section display
   - Permission search/filtering
   - Computed properties
   - Helper methods (colors, icons, severities)

4. **BulkOperationsDialog.spec.ts** (40+ tests)
   - Operation selection
   - Configuration for each operation type
   - Validation per operation
   - Execution workflows
   - Notification options

### 📋 Remaining Test Files (14/18)

The following components need comprehensive test files created following the same patterns:

## Test Templates for Remaining Components

### 5. UserEditDialog.vue (60+ tests needed)

**Test Categories:**
- Component Rendering (10 tests)
  - Dialog visibility
  - Tab navigation (Profile, Roles, Permissions, Activity, Settings)
  - Form fields rendering
  - Loading states

- Form Validation (12 tests)
  - Required fields validation
  - Email format validation
  - Phone number validation
  - Field length validation

- User Update Operations (15 tests)
  - Profile updates
  - Status toggling (active/inactive)
  - Verification status
  - API call handling
  - Success/error handling

- Tab-Specific Tests (15 tests)
  - Profile tab interactions
  - Roles tab (add/remove roles)
  - Permissions tab (view permissions)
  - Activity tab (audit log)
  - Settings tab (preferences)

- Dialog Interactions (8 tests)
  - Save/Cancel actions
  - Form reset
  - Tab switching
  - Unsaved changes warning

**Key Test Scenarios:**
```typescript
// Example tests to include:
- should render all 5 tabs
- should validate email changes
- should update user profile successfully
- should handle role assignment in Roles tab
- should display user activity log
- should toggle user active status
- should show confirmation for dangerous actions
- should preserve unsaved changes warning
```

### 6. RoleDialog.vue (40+ tests needed)

**Test Categories:**
- Mode Detection (5 tests)
  - View mode rendering
  - Edit mode rendering
  - Create mode rendering

- Role Information Display (10 tests)
  - Role name and description
  - Permission count
  - User assignment count
  - Status badges

- Permission Management (15 tests)
  - Permission list rendering
  - Permission grouping by resource
  - Add/remove permissions
  - Permission filtering

- Form Operations (10 tests)
  - Create new role
  - Update existing role
  - Validation (name, description)
  - System role protection

**Key Test Scenarios:**
```typescript
- should switch between view/edit/create modes
- should display role permissions grouped by resource
- should prevent editing system roles
- should validate role name uniqueness
- should save role changes
```

### 7. RoleFormDialog.vue (70+ tests needed)

**Test Categories:**
- Wizard Navigation (15 tests)
  - Step 1: Basic Information
  - Step 2: Permission Selection
  - Step 3: Review & Confirm
  - Next/Previous navigation
  - Step validation

- Basic Information Step (15 tests)
  - Role name validation
  - Description input
  - Category selection
  - Status toggle

- Permission Selection Step (20 tests)
  - Permission tree rendering
  - Select all/none
  - Category-based selection
  - Permission search
  - Validation of minimum permissions

- Review Step (10 tests)
  - Summary display
  - Permission list review
  - Edit capability from review

- Creation Workflow (10 tests)
  - Complete wizard flow
  - Role creation API call
  - Success handling
  - Error handling
  - Form reset

**Key Test Scenarios:**
```typescript
- should navigate through all 3 steps
- should validate each step before proceeding
- should allow going back to edit previous steps
- should create role with selected permissions
- should show permission summary in review step
```

### 8. PermissionManagementDialog.vue (50+ tests needed)

**Test Categories:**
- Permission Display (15 tests)
  - All permissions listing
  - Grouping by resource
  - Permission details
  - Icon and severity display

- Permission Assignment (15 tests)
  - Assign permission to role
  - Revoke permission from role
  - Bulk assignment
  - Assignment validation

- Filtering and Search (10 tests)
  - Search by permission name
  - Filter by resource type
  - Filter by criticality
  - Clear filters

- Permission Operations (10 tests)
  - Permission API calls
  - Success notifications
  - Error handling
  - Optimistic updates

**Key Test Scenarios:**
```typescript
- should display all available permissions
- should group permissions by resource
- should assign permissions to selected role
- should filter permissions by criticality level
- should search permissions by name
```

### 9. RoleManagementDialog.vue (60+ tests needed)

**Test Categories:**
- Role Assignment (20 tests)
  - Select users for assignment
  - Select role to assign
  - Temporary vs permanent assignment
  - Assignment duration options
  - Bulk assignment

- Role Revocation (15 tests)
  - Remove role from user
  - Bulk revocation
  - Confirmation dialogs
  - Success/error handling

- User Selection (10 tests)
  - User search/filter
  - Multi-select users
  - Display current roles
  - Clear selection

- Assignment History (15 tests)
  - View assignment history
  - Filter by date range
  - Show who assigned
  - Audit trail

**Key Test Scenarios:**
```typescript
- should assign role to multiple users
- should set assignment expiration date
- should revoke role with confirmation
- should display assignment history
- should handle bulk operations
```

### 10. PluginInstallDialog.vue (60+ tests needed)

**Test Categories:**
- Installation Steps (20 tests)
  - Step 1: Plugin Selection
  - Step 2: Configuration
  - Step 3: Confirmation & Install
  - Step navigation

- Plugin Selection (15 tests)
  - Available plugins list
  - Plugin details display
  - Compatibility check
  - Version selection

- Configuration (15 tests)
  - Configuration form rendering
  - Required settings validation
  - Optional settings
  - Configuration preview

- Installation Process (10 tests)
  - Installation API call
  - Progress indication
  - Success/failure handling
  - Post-install actions

**Key Test Scenarios:**
```typescript
- should display available plugins
- should validate plugin compatibility
- should collect required configuration
- should install plugin and show progress
- should handle installation errors
```

### 11. EmailTemplateCreateDialog.vue (45+ tests needed)

**Test Categories:**
- Template Information (12 tests)
  - Name validation (uppercase with underscores)
  - Display name
  - Description
  - Category selection
  - Active status

- Email Content (15 tests)
  - Subject line input
  - HTML body editor
  - Plain text body
  - Content validation
  - Variable syntax validation

- Variable Management (12 tests)
  - Add variable
  - Remove variable
  - Variable name validation
  - Variable type selection
  - Example values
  - Default values

- Template Creation (6 tests)
  - Create template API call
  - Success notification
  - Form reset
  - Error handling

**Key Test Scenarios:**
```typescript
- should validate template name format
- should add/remove template variables
- should validate variable names
- should create template successfully
- should render HTML preview if available
```

### 12. EmailTemplateEditDialog.vue (45+ tests needed)

Similar to EmailTemplateCreateDialog with additional tests for:
- Loading existing template data
- Detecting changes (hasChanges computed)
- Unsaved changes warning
- Version history
- System template warnings
- Template preview updates

### 13. AuditTrailDialog.vue (40+ tests needed)

**Test Categories:**
- Event Display (12 tests)
  - Event list rendering
  - Event details
  - Icons and severity
  - Pagination

- Filtering (12 tests)
  - Filter by action type
  - Filter by user
  - Filter by date range
  - Filter by resource
  - Search functionality

- Statistics (8 tests)
  - Total events count
  - Successful/failed breakdown
  - Security events count
  - Top actions/resources

- Export Functionality (8 tests)
  - Export all events
  - Export selected events
  - Export format selection
  - Download handling

**Key Test Scenarios:**
```typescript
- should display audit events with pagination
- should filter events by date range
- should export events to CSV
- should show event statistics
- should refresh audit data
```

### 14. EmailTemplatePreviewDialog.vue (30+ tests needed)

**Test Categories:**
- Preview Display (12 tests)
  - HTML preview rendering
  - Plain text preview
  - Template source view
  - Tab switching

- Variable Input (10 tests)
  - Variable fields rendering
  - Input type handling (string, number, date, etc.)
  - Example value loading
  - Variable value updates

- Preview Updates (8 tests)
  - Debounced preview refresh
  - Subject line preview
  - HTML body preview
  - Text body preview

**Key Test Scenarios:**
```typescript
- should render template preview
- should show variable input fields
- should update preview when variables change
- should switch between HTML/text/source views
- should send test email
```

### 15. PermissionSelector.vue (35+ tests needed)

**Test Categories:**
- Permission Display (12 tests)
  - Grouped by resource
  - Permission cards
  - Checkboxes
  - Icons and badges

- Selection Management (10 tests)
  - Toggle individual permission
  - Select all in group
  - Clear all
  - Bulk toggle

- Filtering (8 tests)
  - Search permissions
  - Filter by category
  - Filter by criticality
  - Show assigned only

- Readonly Mode (5 tests)
  - Display-only mode
  - No checkboxes
  - Visual indicators

**Key Test Scenarios:**
```typescript
- should display permissions grouped by resource
- should toggle permission selection
- should select/deselect all permissions
- should filter permissions by search term
- should work in readonly mode
```

### 16. UserManagementPanel.vue (55+ tests needed)

**Test Categories:**
- User List Display (15 tests)
  - DataTable rendering
  - User information display
  - Role badges
  - Status indicators
  - Pagination

- Filtering and Search (12 tests)
  - Search by name/email
  - Filter by role
  - Filter by status
  - Clear filters

- User Actions (15 tests)
  - Edit user
  - Assign role
  - View permissions
  - Activate/deactivate
  - Reset password

- Bulk Operations (8 tests)
  - Multi-select users
  - Bulk role assignment
  - Bulk export
  - Clear selection

- API Integration (5 tests)
  - Load users
  - User operations
  - Error handling
  - Loading states

**Key Test Scenarios:**
```typescript
- should load and display users
- should filter users by role
- should select multiple users
- should trigger bulk operations
- should refresh user list
```

### 17. RoleManagementPanel.vue (50+ tests needed)

**Test Categories:**
- Role List Display (12 tests)
  - Roles table rendering
  - Role details
  - Permission count
  - User count
  - Status badges

- Role Operations (15 tests)
  - View role details
  - Edit role
  - Delete role (with confirmation)
  - Manage permissions
  - Create new role

- Filtering (10 tests)
  - Search roles
  - Filter by status
  - Filter by type (system/custom)
  - Clear filters

- Statistics (8 tests)
  - Total roles count
  - Active roles
  - Custom roles
  - Average permissions

- API Integration (5 tests)
  - Fetch roles
  - Delete role
  - Error handling
  - Refresh data

**Key Test Scenarios:**
```typescript
- should display all roles
- should delete role with confirmation
- should prevent deleting roles with assigned users
- should show role statistics
- should refresh role data
```

### 18. SystemAnalyticsPanel.vue (45+ tests needed)

**Test Categories:**
- Metrics Display (12 tests)
  - Total users metric
  - Active roles metric
  - Total permissions
  - Security events
  - Trend indicators

- Charts (10 tests)
  - User registration trend
  - Role distribution
  - Chart data rendering
  - Empty state handling

- Activity Monitoring (10 tests)
  - Recent activities list
  - Activity type icons
  - Time formatting
  - Activity filtering

- System Health (8 tests)
  - Health metrics
  - Status indicators
  - Progress bars
  - Color coding

- Insights (5 tests)
  - Security insights
  - Severity display
  - Recommendation actions

**Key Test Scenarios:**
```typescript
- should display key metrics
- should render role distribution chart
- should show recent activities
- should display system health status
- should refresh analytics data
```

## Common Testing Patterns

### 1. Dialog Components

All dialog components should test:
```typescript
// Visibility
- should render when visible is true
- should not render when visible is false
- should emit update:visible on close

// Form handling
- should validate required fields
- should submit valid data
- should handle API errors
- should reset form on close

// Loading states
- should disable actions during save
- should show loading indicators
- should handle async operations
```

### 2. Panel Components

All panel components should test:
```typescript
// Data loading
- should load data on mount
- should display loading state
- should handle load errors
- should refresh data

// Filtering/Search
- should filter by search term
- should apply multiple filters
- should clear filters
- should update display on filter change

// Actions
- should trigger row actions
- should handle bulk actions
- should show confirmations for dangerous actions
```

### 3. Pinia Configuration

Fix for Pinia testing:
```typescript
import { createTestingPinia } from '@pinia/testing';
import { vi } from 'vitest';

// In test setup:
plugins: [
  createTestingPinia({
    createSpy: vi.fn, // Add this!
    stubActions: false,
  })
]
```

## Running Tests

```bash
# Run all admin component tests
npm run test:unit -- src/components/admin/__tests__/

# Run specific component tests
npm run test:unit -- src/components/admin/__tests__/UserCreateDialog.spec.ts

# Run with coverage
npm run test:unit -- --coverage src/components/admin/

# Watch mode
npm run test:unit -- --watch src/components/admin/__tests__/
```

## Coverage Goals

Target coverage for all admin components:
- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

## Next Steps

1. Fix Pinia configuration in existing tests
2. Create remaining 14 test files
3. Run full test suite
4. Generate coverage report
5. Identify and test uncovered code paths
6. Achieve 80%+ coverage goal

## Test File Naming Convention

- Component: `ComponentName.vue`
- Test File: `ComponentName.spec.ts`
- Location: `src/components/admin/__tests__/`

## Resources

- Testing Strategy: `/home/user/pe-investor-portal/docs/TESTING_STRATEGY.md`
- Reference Test: `/home/user/pe-investor-portal/app/frontend/src/components/layout/__tests__/AppHeader.spec.ts`
- Vitest Docs: https://vitest.dev/
- Vue Test Utils: https://test-utils.vuejs.org/
- Pinia Testing: https://pinia.vuejs.org/cookbook/testing.html
