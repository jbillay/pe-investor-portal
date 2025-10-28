# Dynamic Data Objects - Implementation Summary

**Quick Reference Guide**

---

## Overview

This feature enables administrators to create configurable data structures (data objects) and end-users to create instances of those structures through automatically generated forms and tables.

**Two Main Parts**:
1. **Admin Configuration**: SUPER_ADMIN creates data object definitions with custom fields
2. **User Interface**: Users create/view instances through auto-generated forms and tables

---

## Key Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Versioning** | Create new version on schema changes, keep history | Maintains data integrity and audit trail |
| **Storage Pattern** | EAV (Entity-Attribute-Value) | Flexible, queryable, type-safe |
| **Permissions** | Per data object type (FUND:READ, FUND:WRITE, FUND:DELETE) | Simple, clear access control |
| **Multi-tenancy** | Not implemented | Simplified initial scope |
| **Dropdown Options** | Admin-defined static options | Straightforward configuration |
| **Deletion** | Hard delete | Simplified data management |
| **Validation** | Always against current schema rules | Ensures data consistency |
| **API Structure** | Dynamic endpoints based on dataKey (/api/v1/dynamic/fund) | Clean, RESTful design |

---

## Database Tables (Simplified)

### Core Tables
- **data_objects**: Stores data object definitions (name, dataKey, version)
- **data_object_versions**: Version history with schema snapshots
- **data_fields**: Field definitions for each data object
- **field_validation_rules**: Validation rules per field
- **field_dropdown_options**: Options for select fields

### Instance Tables (EAV Pattern)
- **data_object_instances**: Instance records
- **instance_field_values**: Actual field values (EAV storage)
- **instance_change_log**: Audit trail of changes

---

## Supported Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| TEXT | Single-line text | Names, titles |
| TEXTAREA | Multi-line text | Descriptions |
| NUMBER | Numeric input | Quantities, percentages |
| CURRENCY | Money with currency | Fund values, amounts |
| DATE | Date picker | Start dates, deadlines |
| DATETIME | Date + time | Timestamps |
| BOOLEAN | Checkbox/toggle | Yes/No flags |
| SINGLE_SELECT | Dropdown (single) | Categories, status |
| MULTI_SELECT | Dropdown (multiple) | Tags, multiple categories |
| EMAIL | Email with validation | Contact emails |
| URL | URL with validation | Website links |
| FILE | File upload | Documents, attachments |
| RICH_TEXT | WYSIWYG editor | Formatted content |
| RELATIONSHIP | Link to another object | Cross-references |

---

## API Endpoints Overview

### Admin Endpoints (SUPER_ADMIN only)

```
# Data Objects
POST   /api/v1/admin/data-objects              # Create data object
GET    /api/v1/admin/data-objects              # List all data objects
GET    /api/v1/admin/data-objects/:id          # Get single with fields
PUT    /api/v1/admin/data-objects/:id          # Update (creates new version)
DELETE /api/v1/admin/data-objects/:id          # Delete data object

# Fields
POST   /api/v1/admin/data-objects/:id/fields   # Add field
PUT    /api/v1/admin/data-objects/:id/fields/:fieldId  # Update field
DELETE /api/v1/admin/data-objects/:id/fields/:fieldId  # Delete field

# Versions
GET    /api/v1/admin/data-objects/:id/versions  # Version history
GET    /api/v1/admin/data-objects/:id/versions/:version  # Specific version
```

### Dynamic Data Endpoints (Permission-based)

```
# Schema
GET    /api/v1/dynamic/:dataKey/schema         # Get schema for form/table

# Instances
POST   /api/v1/dynamic/:dataKey                # Create instance
GET    /api/v1/dynamic/:dataKey                # List instances (with filters)
GET    /api/v1/dynamic/:dataKey/:id            # Get single instance
PUT    /api/v1/dynamic/:dataKey/:id            # Update instance
DELETE /api/v1/dynamic/:dataKey/:id            # Delete instance

# Advanced
POST   /api/v1/dynamic/:dataKey/search         # Advanced search/filter
GET    /api/v1/dynamic/:dataKey/export         # Export to CSV/Excel
GET    /api/v1/dynamic/:dataKey/:id/history    # Change history
```

---

## Frontend Components

### Admin Panel
- **DataObjectManager.vue**: Main view for managing data objects
- **DataObjectEditor.vue**: Dialog for creating/editing data objects
- **FieldEditor.vue**: Dialog for adding/editing fields
- **VersionHistory.vue**: View version history

### User Interface
- **DynamicForm.vue**: Auto-generated form for create/edit
- **DynamicTable.vue**: Auto-generated table for viewing all instances
- **DynamicFilters.vue**: Advanced filter panel
- **DynamicCellRenderer.vue**: Renders cell values based on type
- **Field Input Components**: 14 specialized input components for each field type

---

## Implementation Phases (5 Weeks)

### Week 1: Backend Foundation
- Database schema setup (Prisma)
- Admin module services and controllers
- Dynamic data services (basic CRUD)

### Week 2: Backend Advanced Features
- Validation service
- Audit and change tracking
- Export functionality
- Advanced querying

### Week 3: Frontend Admin Panel
- Admin UI components
- Data object editor
- Field management
- Version history

### Week 4: Frontend Dynamic Components
- Dynamic form generation
- Dynamic table with sorting/filtering
- Field input components
- Export integration

### Week 5: Testing & Polish
- Comprehensive testing (80%+ coverage)
- Performance optimization
- Security audit
- Documentation completion
- Deployment preparation

---

## Key Features

### Versioning
- Every schema change creates a new version
- Complete snapshot stored for each version
- Instances track which version they were created with
- Historical versions can be viewed

### Validation
- Client-side validation (immediate feedback)
- Server-side validation (security)
- Type validation (match field data type)
- Custom rules (min/max length, regex, etc.)
- Always validates against current schema

### Permissions
- Automatic permission creation: `{DATAKEY}:READ`, `{DATAKEY}:WRITE`, `{DATAKEY}:DELETE`
- Example: `FUND:READ`, `FUND:WRITE`, `FUND:DELETE`
- Backend guards enforce permissions
- Frontend UI adapts based on permissions

### Audit Trail
- Track all changes to instances
- Store old value, new value, who changed, when
- View complete history per instance
- Field-level granularity

### Search & Filter
- Global search across all fields
- Per-column filtering
- Advanced filter builder with multiple criteria
- Support for operators: equals, contains, greater than, less than, between, etc.
- Save filter presets (future)

### Export
- Export to CSV or Excel
- Includes filtered/sorted data
- Proper formatting for each field type
- Handles large datasets

---

## Technical Highlights

### EAV Pattern Benefits
```
Instead of creating new tables for each data object,
we store all data in a flexible structure:

instance_field_values table:
- instanceId: which instance
- fieldId: which field
- textValue: for text fields
- numberValue: for numeric fields
- dateValue: for date fields
- booleanValue: for boolean fields
- jsonValue: for complex types

This allows unlimited custom fields without ALTER TABLE!
```

### Dynamic Form Generation
```typescript
// Frontend automatically renders form based on schema
GET /api/v1/dynamic/fund/schema
→ Returns field definitions
→ Component renders appropriate input for each field type
→ Applies validation rules
→ Submits data in correct format
```

### Permission Check Flow
```typescript
// Backend automatically checks permissions
User requests: POST /api/v1/dynamic/fund
→ Extract dataKey: "fund"
→ Check permission: "FUND:WRITE"
→ Allow/Deny request
```

---

## Example Workflow

### Admin Creates "Fund" Data Object

1. Admin navigates to Admin Panel → Data Objects
2. Clicks "Create Data Object"
3. Enters:
   - Name: "Fund"
   - Description: "PE fund management"
   - DataKey: "fund" (auto-generated from name)
4. Adds fields:
   - Fund Name (TEXT, mandatory, min 3 chars)
   - Fund Value (CURRENCY, mandatory)
   - Start Date (DATE, mandatory)
   - Fund Type (SINGLE_SELECT with options: VC, PE, Growth)
   - Description (TEXTAREA, optional)
5. Clicks "Save"
6. System creates:
   - Data object record
   - 5 field records
   - Version 1 record with schema snapshot
   - 3 permissions: FUND:READ, FUND:WRITE, FUND:DELETE

### User Creates Fund Instance

1. User with FUND:WRITE permission navigates to Funds
2. Clicks "Create Fund"
3. Form automatically appears with:
   - Fund Name text input (required)
   - Fund Value currency input (required)
   - Start Date date picker (required)
   - Fund Type dropdown with options (required)
   - Description textarea (optional)
4. User fills form:
   - Fund Name: "OPC II"
   - Fund Value: $1,000,000.00
   - Start Date: 12/10/1981
   - Fund Type: PE
   - Description: "Fund of OPC"
5. Client-side validation checks fields
6. User clicks "Save"
7. System validates and creates:
   - Instance record
   - 5 field value records (one per field)
   - Change log entry (CREATE)
8. User redirected to fund list showing all funds in table

---

## Testing Strategy

### Backend
- **Unit tests**: All services (target 80%+ coverage)
- **Integration tests**: All API endpoints
- **E2E tests**: Critical workflows (create object → create instance)

### Frontend
- **Unit tests**: Composables and utilities
- **Component tests**: All major components
- **E2E tests**: User journeys (Cypress)

### Manual Testing
- Permission scenarios
- Validation edge cases
- Large dataset performance
- Cross-browser compatibility
- Mobile responsiveness

---

## Success Criteria Checklist

### Functional
- [ ] Admin can create/edit/delete data objects
- [ ] Admin can add/edit/delete fields
- [ ] Versioning works correctly
- [ ] Dynamic forms render correctly for all field types
- [ ] Dynamic tables display data with sorting/filtering
- [ ] Validation works on both client and server
- [ ] Permissions control access properly
- [ ] Change tracking logs all modifications
- [ ] Export to CSV/Excel works

### Non-Functional
- [ ] API responses < 500ms
- [ ] Handles 1000+ instances per data object
- [ ] 80%+ test coverage
- [ ] WCAG AA accessibility compliance
- [ ] Mobile responsive
- [ ] Complete documentation

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance with large datasets | Efficient indexing, cursor pagination, query optimization |
| Complex validation logic | Thorough testing, use proven libraries |
| Schema versioning complexity | Clear versioning strategy, test migration scenarios |
| User confusion | Intuitive UI, comprehensive documentation |
| Permission misconfiguration | Clear permission model, admin UI |

---

## Quick Start After Implementation

### As Admin - Create Your First Data Object

1. Login as SUPER_ADMIN
2. Navigate to Admin → Data Objects
3. Click "Create Data Object"
4. Follow the wizard to define fields
5. Save and assign permissions to users

### As User - Create Instance

1. Login with appropriate permissions (e.g., FUND:WRITE)
2. Navigate to the data object menu item (e.g., "Funds")
3. Click "Create" button
4. Fill the auto-generated form
5. Save

---

## Future Enhancements (Not in v1)

- Data object templates
- Calculated/formula fields
- Workflow and approvals
- Bulk import from CSV/Excel
- Data object inheritance
- Multi-language support
- Custom actions
- Built-in reporting and analytics

---

## Reference Documents

- **Full Specification**: `docs/features/dynamic-data-objects-specification.md`
- **API Documentation**: `docs/api/dynamic-data-objects.md` (to be created)
- **Admin Guide**: `docs/guides/admin-data-objects-guide.md` (to be created)
- **User Guide**: `docs/guides/user-dynamic-forms-guide.md` (to be created)

---

**For detailed implementation instructions, refer to the full specification document.**
