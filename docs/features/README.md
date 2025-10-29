# Dynamic Data Objects - Documentation Index

Welcome to the Dynamic Data Objects feature documentation!

---

## 📚 Documentation Files

### For End Users

#### [User Guide](./dynamic-data-objects-user-guide.md)
**Who should read**: End users who will be creating and managing data object instances

**What's inside**:
- How to access and use the dashboard widget
- Step-by-step guide for creating instances
- Understanding different field types
- Tips and best practices
- Troubleshooting common issues
- FAQ and glossary

**Start here if you**: Want to learn how to use the feature from a user perspective

---

### For Developers

#### [Implementation Documentation](./dynamic-data-objects-implementation.md)
**Who should read**: Developers working on the codebase

**What's inside**:
- Complete architecture overview
- Database schema details
- Backend implementation (services, controllers, guards)
- Frontend implementation (components, composables)
- File structure and organization
- Developer guide for extending functionality
- Testing strategies
- Troubleshooting technical issues

**Start here if you**: Need to understand how the feature works internally or want to extend it

---

#### [API Reference](./dynamic-data-objects-api.md)
**Who should read**: Developers integrating with the API, frontend developers, API consumers

**What's inside**:
- Complete API endpoint documentation
- Request/response examples
- Data models and TypeScript interfaces
- Error codes and handling
- Rate limiting information
- Best practices for API usage
- Code examples

**Start here if you**: Need to make API calls or integrate with the dynamic data system

---

### For Planning & Architecture

#### [Technical Specification](./dynamic-data-objects-specification.md)
**Who should read**: Architects, senior developers, project managers

**What's inside**:
- Original feature specification
- Detailed architecture design
- Complete database schema design
- API design patterns
- Component specifications
- Implementation task breakdown (5-week plan)
- Security and permissions model
- Success criteria and risk mitigation

**Start here if you**: Need to understand the original design and full scope of the feature

---

#### [Summary Document](./dynamic-data-objects-summary.md)
**Who should read**: Anyone needing a quick overview

**What's inside**:
- High-level feature overview
- Key decisions and rationale
- Supported field types
- API endpoints overview
- Implementation phases summary
- Quick reference for common patterns

**Start here if you**: Want a quick overview without diving into details

---

## 🎯 Quick Navigation

### I want to...

#### Learn how to use the feature
→ Read the [User Guide](./dynamic-data-objects-user-guide.md)

#### Make API calls
→ Read the [API Reference](./dynamic-data-objects-api.md)

#### Understand the code
→ Read the [Implementation Documentation](./dynamic-data-objects-implementation.md)

#### Add a new field type
→ See "Extending with New Field Types" in [Implementation Documentation](./dynamic-data-objects-implementation.md#extending-with-new-field-types)

#### Understand the database schema
→ See "Database Schema" section in [Implementation Documentation](./dynamic-data-objects-implementation.md#database-schema)

#### See what's planned vs. implemented
→ Compare [Technical Specification](./dynamic-data-objects-specification.md) with [Implementation Documentation](./dynamic-data-objects-implementation.md)

#### Fix a bug
→ See "Troubleshooting" in [Implementation Documentation](./dynamic-data-objects-implementation.md#troubleshooting)

#### Optimize performance
→ See "Performance Optimization Tips" in [Implementation Documentation](./dynamic-data-objects-implementation.md#performance-optimization-tips)

---

## 📊 Feature Status

### ✅ Implemented

- Schema Service (retrieve schemas by ID or key)
- Instance Service (full CRUD operations)
- Validation Service (field and schema validation)
- Export Service (CSV/Excel export - backend ready)
- DataInstanceController (ID-based API)
- DynamicController (key-based API)
- DynamicPermissionGuard (permission checking)
- DataObjectWidget (dashboard widget)
- DynamicForm (auto-generated forms)
- DynamicTable (auto-generated tables)
- All 13 field input components
- All 12 cell renderer components
- useDataObjects composable
- useDataInstances composable
- Create instance functionality
- Delete instance functionality
- View instances list
- Field validation (client and server)

### 🚧 In Progress / Planned

- Edit instance functionality (UI needed)
- View instance details dialog (UI needed)
- Advanced filtering (planned)
- Export UI integration (backend ready)
- Bulk operations (planned)
- Instance history view (backend ready)
- Search enhancement (basic search exists)
- Sort/filter in widget (currently in table only)

### 📋 Future Enhancements

- Field dependencies (conditional fields)
- Calculated fields (formulas)
- Workflow and approvals
- Data object templates
- Multi-language support
- Inline editing in tables
- Custom actions
- Built-in reporting

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Frontend (Vue 3)                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Dashboard → DataObjectWidget             │  │
│  │    ↓                                      │  │
│  │  DynamicForm / DynamicTable               │  │
│  │    ↓                                      │  │
│  │  Field Components (13 types)              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓ HTTP API
┌─────────────────────────────────────────────────┐
│              Backend (NestJS)                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Controllers:                             │  │
│  │  • DataInstanceController (ID-based)      │  │
│  │  • DynamicController (key-based)          │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Services:                                │  │
│  │  • SchemaService                          │  │
│  │  • InstanceService                        │  │
│  │  • ValidationService                      │  │
│  │  • ExportService                          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓ Prisma ORM
┌─────────────────────────────────────────────────┐
│          Database (PostgreSQL)                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Schema Tables:                           │  │
│  │  • data_objects                           │  │
│  │  • data_fields                            │  │
│  │  • field_validation_rules                 │  │
│  │  • field_dropdown_options                 │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Instance Tables (EAV):                   │  │
│  │  • data_object_instances                  │  │
│  │  • instance_field_values                  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Key Concepts

### Data Object
A template/definition that describes what kind of information should be collected.

**Example**: "Company" data object with fields: Company Name, Type, Revenue

### Instance
A concrete record created from a data object template.

**Example**: "Acme Corporation" is an instance of the "Company" data object

### Field
A single piece of information in a data object.

**Example**: "Company Name" field in the "Company" data object

### Field Types
The 13 supported field types:
- TEXT, TEXTAREA, RICH_TEXT
- NUMBER, CURRENCY
- DATE, DATETIME
- BOOLEAN
- SINGLE_SELECT, MULTI_SELECT
- EMAIL, URL
- FILE

### EAV Pattern
Entity-Attribute-Value storage pattern that allows flexible schema without database migrations.

**Benefits**:
- Add fields without ALTER TABLE
- Type-safe storage in dedicated columns
- Efficient querying with proper indexes
- Field-level validation

---

## 🔐 Permissions

### Permission Format
`{DATAKEY}:ACTION`

**Examples**:
- `COMPANY:READ` - View company instances
- `COMPANY:WRITE` - Create/edit company instances
- `COMPANY:DELETE` - Delete company instances

### How It Works
1. Data object has a `dataKey` (e.g., "company")
2. System creates permissions: `COMPANY:READ`, `COMPANY:WRITE`, `COMPANY:DELETE`
3. Users/roles are assigned these permissions
4. API endpoints check permissions before allowing actions

---

## 📁 File Locations

### Backend
```
app/backend/src/dynamic-data/
├── controllers/
│   ├── data-instance.controller.ts
│   └── dynamic.controller.ts
├── services/
│   ├── schema.service.ts
│   ├── instance.service.ts
│   ├── validation.service.ts
│   └── export.service.ts
├── guards/
│   └── dynamic-permission.guard.ts
├── dto/
│   ├── create-instance.dto.ts
│   └── query-params.dto.ts
└── dynamic-data.module.ts
```

### Frontend
```
app/frontend/src/
├── components/dynamic/
│   ├── DataObjectWidget.vue
│   ├── DynamicForm.vue
│   ├── DynamicTable.vue
│   ├── DynamicFormField.vue
│   ├── fields/          # 13 field components
│   └── cells/           # 12 cell components
├── composables/admin/
│   ├── useDataObjects.ts
│   └── useDataInstances.ts
└── types/
    └── dynamic-data.ts
```

### Database
```
app/backend/src/database/prisma/
├── schema.prisma        # Data object models
└── migrations/          # Schema migrations
```

---

## 🧪 Testing

### Backend Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Frontend Tests
```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:components

# E2E tests (Cypress)
npm run test:e2e
```

---

## 📞 Support

### For Users
- Read the [User Guide](./dynamic-data-objects-user-guide.md)
- Contact your system administrator
- Check the FAQ section

### For Developers
- Read the [Implementation Documentation](./dynamic-data-objects-implementation.md)
- Check the [API Reference](./dynamic-data-objects-api.md)
- Review existing code
- Consult the development team

### Reporting Issues
1. Check troubleshooting sections
2. Review existing documentation
3. Create detailed bug report with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

---

## 📝 Documentation Standards

### When to Update
- Adding new field types
- Changing API endpoints
- Modifying database schema
- Adding new features
- Fixing significant bugs

### How to Update
1. Identify which documents are affected
2. Update all relevant sections
3. Maintain consistency across documents
4. Update version numbers and dates
5. Add to changelog

### Document Relationships
```
Specification (original plan)
    ↓ guides
Implementation (what was built)
    ↓ exposes
API Reference (how to use)
    ↓ for
User Guide (end-user docs)
```

---

## 🎓 Learning Path

### For New Users
1. Read: [User Guide](./dynamic-data-objects-user-guide.md) - "Getting Started"
2. Practice: Create your first instance
3. Explore: Try different field types
4. Read: [User Guide](./dynamic-data-objects-user-guide.md) - "Tips and Best Practices"

### For New Developers
1. Read: [Summary Document](./dynamic-data-objects-summary.md) - Quick overview
2. Read: [Implementation Documentation](./dynamic-data-objects-implementation.md) - Architecture
3. Read: [API Reference](./dynamic-data-objects-api.md) - Endpoints
4. Practice: Make test API calls
5. Read: [Implementation Documentation](./dynamic-data-objects-implementation.md) - Code organization
6. Explore: Browse actual code files

### For System Administrators
1. Read: [Summary Document](./dynamic-data-objects-summary.md)
2. Read: [User Guide](./dynamic-data-objects-user-guide.md) - To help users
3. Read: [Technical Specification](./dynamic-data-objects-specification.md) - Permissions model
4. Read: [Implementation Documentation](./dynamic-data-objects-implementation.md) - Troubleshooting

---

## 📈 Version History

### v1.0 (2025-10-29)
**Status**: Current

**Implemented**:
- Complete backend API (ID-based and key-based)
- Schema service with caching
- Instance CRUD operations
- Validation service
- Export service (backend)
- Dashboard widget integration
- Auto-generated forms
- Auto-generated tables
- 13 field input components
- 12 cell renderer components
- Permission-based access control

**Documentation**:
- Technical specification
- Implementation documentation
- API reference
- User guide
- Summary document

---

## 🔗 Related Documentation

### Project-Wide Documentation
- [Main README](../../README.md)
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [E2E Test Automation](../E2E_TEST_AUTOMATION.md)
- [Plugin Development](../PLUGIN_DEVELOPMENT_GUIDE.md)

### External Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [Vue 3 Documentation](https://vuejs.org/)
- [PrimeVue Documentation](https://primevue.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Last Updated**: 2025-10-29
**Documentation Version**: 1.0
**Feature Version**: 1.0
