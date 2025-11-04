/**
 * Role Test Data Factory
 * Creates consistent test data for roles
 */

export const createMockRole = (overrides: Partial<any> = {}) => ({
  id: 'role-1',
  name: 'USER',
  description: 'Standard user role',
  isActive: true,
  isDefault: false,
  isSystem: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'admin-1',
  ...overrides,
});

export const createMockRoleList = (count: number) => {
  const roleNames = ['ADMIN', 'USER', 'MANAGER', 'VIEWER', 'EDITOR'];
  return Array.from({ length: count }, (_, i) =>
    createMockRole({
      id: `role-${i + 1}`,
      name: roleNames[i] || `ROLE${i + 1}`,
      description: `${roleNames[i] || `Role ${i + 1}`} description`,
    })
  );
};

export const createMockUserRole = (overrides: Partial<any> = {}) => ({
  id: 'user-role-1',
  userId: 'user-1',
  roleId: 'role-1',
  assignedBy: 'admin-1',
  assignedAt: new Date('2024-01-01'),
  expiresAt: null,
  context: null,
  ...overrides,
});

export const createMockRoleWithPermissions = (overrides: Partial<any> = {}) => ({
  ...createMockRole(overrides),
  _count: { userRoles: 0, ...(overrides._count || {}) },
  rolePermissions: [
    {
      id: 'role-perm-1',
      roleId: 'role-1',
      permissionId: 'perm-1',
      permission: {
        id: 'perm-1',
        name: 'users.read',
        description: 'Read users',
        resource: 'users',
        action: 'read',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      assignedBy: 'admin-1',
      assignedAt: new Date('2024-01-01'),
    },
  ],
});
