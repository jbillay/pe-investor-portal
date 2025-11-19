# PE Investor Portal - Documentation Index

Welcome to the PE Investor Portal documentation! This guide will help you navigate the available documentation based on your role and needs.

## 📚 Documentation by Audience

### For Plugin Developers

Start here if you're building plugins for the PE Investor Portal:

1. **[PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md)** - **START HERE**
   - Complete guide to plugin development
   - Plugin manifest specification
   - Widget and menu integration
   - Lifecycle hooks
   - Advanced topics: Dynamic Data Objects, RBAC, Email, Audit Trail
   - Complete hello-world example

2. **[CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md)** - **API REFERENCE**
   - Complete REST API documentation
   - Authentication and permissions
   - Dynamic Data Objects CRUD operations
   - RBAC & Permissions management
   - Email system integration
   - Audit trail logging
   - File upload APIs
   - Error handling and rate limiting
   - Complete code examples

3. **[PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md)** - **PE-SPECIFIC GUIDE**
   - PE plugin strategy and categories
   - Common PE data models (Fund, Commitment, Capital Call, etc.)
   - Shared components and utilities
   - Plugin interaction patterns
   - Security and compliance guidelines
   - Performance optimization
   - Use case examples

### For Core Platform Developers

Documentation for developers working on the core platform:

4. **[../claude.md](../claude.md)** - **CORE PLATFORM GUIDE**
   - Complete tech stack overview
   - Development guidelines and code standards
   - Database models and schema
   - Authentication and security implementation
   - Testing strategy
   - Implemented features status

5. **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)** - **TESTING GUIDE**
   - Testing approach and strategy
   - Unit test patterns
   - Integration testing
   - E2E testing with Playwright

### For System Administrators

6. **Plugin Installation & Management** (Coming Soon)
   - Installing plugins
   - Managing permissions
   - Monitoring plugin performance
   - Troubleshooting

## 🚀 Quick Start Guides

### Building Your First Plugin

1. Read [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md) - Sections 1-6
2. Review the Hello World example in Section 8
3. Study [CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md) - Dynamic Data Objects section
4. Check [PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md) for PE-specific patterns
5. Build your plugin using the patterns and examples

### Building a PE-Specific Plugin

1. Review [PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md) - Common Data Models
2. Choose appropriate data model templates (Fund, Commitment, etc.)
3. Define plugin permissions following RBAC patterns
4. Implement using examples from [CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md)
5. Add email notifications and audit logging
6. Test with different user roles

## 📂 Feature-Specific Documentation

### Dynamic Data Objects

- **Specification**: [features/dynamic-data-objects-specification.md](./features/dynamic-data-objects-specification.md)
- **Implementation**: [features/dynamic-data-objects-implementation.md](./features/dynamic-data-objects-implementation.md)
- **API Reference**: [features/dynamic-data-objects-api.md](./features/dynamic-data-objects-api.md)
- **User Guide**: [features/dynamic-data-objects-user-guide.md](./features/dynamic-data-objects-user-guide.md)

## 🔍 Finding What You Need

### Common Questions

**Q: How do I store plugin data?**
→ See [CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md) - Dynamic Data Objects API section

**Q: How do I integrate with RBAC?**
→ See [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md) - Permission Management section
→ See [CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md) - RBAC & Permissions API section

**Q: How do I send emails from my plugin?**
→ See [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md) - Email Integration section
→ See [CORE_API_REFERENCE.md](./CORE_API_REFERENCE.md) - Email System API section

**Q: How do plugins communicate with each other?**
→ See [PLUGIN_DEVELOPMENT_GUIDE.md](./PLUGIN_DEVELOPMENT_GUIDE.md) - Inter-Plugin Communication section
→ See [PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md) - Plugin Interaction Patterns section

**Q: What shared components are available?**
→ See [PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md) - Shared Components & Utilities section

**Q: What are the standard PE data models?**
→ See [PE_PLUGIN_ARCHITECTURE.md](./PE_PLUGIN_ARCHITECTURE.md) - Common PE Data Models section

## 📝 Documentation Standards

When contributing to documentation:

1. **Use Markdown**: All documentation in `.md` format
2. **Include Examples**: Provide working code examples
3. **Update Index**: Add new documents to this README
4. **Version History**: Document changes at bottom of files
5. **Target Audience**: Specify at top of each document

## 🔗 External Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PrimeVue Component Library](https://primevue.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 📧 Support

For questions or clarifications:
- Create an issue in the project repository
- Contact the development team
- Refer to troubleshooting sections in individual guides

---

**Last Updated**: November 2025
**Maintained By**: PE Investor Portal Development Team
