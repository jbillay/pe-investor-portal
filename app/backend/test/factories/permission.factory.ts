/**
 * Permission Test Data Factory
 * Creates consistent test data for permissions
 */

export const createMockPermission = (overrides: Partial<any> = {}) => ({
  id: 'perm-1',
  name: 'users.read',
  description: 'Read users',
  resource: 'users',
  action: 'read',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockPermissionList = (count: number) => {
  const resources = ['users', 'roles', 'permissions', 'data-objects'];
  const actions = ['read', 'create', 'update', 'delete'];

  return Array.from({ length: count }, (_, i) => {
    const resource = resources[i % resources.length];
    const action = actions[Math.floor(i / resources.length) % actions.length];
    return createMockPermission({
      id: `perm-${i + 1}`,
      name: `${resource}.${action}`,
      description: `${action} ${resource}`,
      resource,
      action,
    });
  });
};

export const createMockRolePermission = (overrides: Partial<any> = {}) => ({
  id: 'role-perm-1',
  roleId: 'role-1',
  permissionId: 'perm-1',
  assignedBy: 'admin-1',
  assignedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockUserPermission = (overrides: Partial<any> = {}) => ({
  id: 'user-perm-1',
  userId: 'user-1',
  permissionId: 'perm-1',
  assignedBy: 'admin-1',
  assignedAt: new Date('2024-01-01'),
  expiresAt: null,
  ...overrides,
});
