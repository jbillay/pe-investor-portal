import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDynamicData } from '../useDynamicData';
import type {
  DynamicSchema,
  DynamicInstance,
  PaginatedInstances,
  CreateInstanceDto,
  UpdateInstanceDto,
  QueryParams,
  ChangeLogEntry,
  FieldDataType
} from '@/types/dynamic-data';

// Mock useApi
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ api: mockApi })
}));

describe('useDynamicData', () => {
  const TEST_DATA_KEY = 'test-data-key';
  let composable: ReturnType<typeof useDynamicData>;

  const mockSchema: DynamicSchema = {
    dataObjectId: 'schema-1',
    dataKey: TEST_DATA_KEY,
    name: 'Test Schema',
    description: 'A test schema',
    version: 1,
    fields: [
      {
        id: 'field-1',
        fieldKey: 'name',
        name: 'Name',
        dataType: 'TEXT' as FieldDataType,
        fieldOrder: 1,
        isMandatory: true,
        isReadOnly: false,
        validationRules: []
      },
      {
        id: 'field-2',
        fieldKey: 'email',
        name: 'Email',
        dataType: 'EMAIL' as FieldDataType,
        fieldOrder: 2,
        isMandatory: false,
        isReadOnly: false,
        validationRules: []
      }
    ],
    permissions: {
      canRead: true,
      canWrite: true,
      canDelete: false
    }
  };

  const mockInstance: DynamicInstance = {
    id: 'instance-1',
    dataObjectId: 'schema-1',
    versionNumber: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    values: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  const mockPaginatedResponse: PaginatedInstances = {
    items: [mockInstance],
    pagination: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  };

  const mockChangeLogEntry: ChangeLogEntry = {
    id: 'log-1',
    instanceId: 'instance-1',
    fieldId: 'field-1',
    fieldName: 'Name',
    changeType: 'UPDATE' as any,
    oldValue: 'Jane Doe',
    newValue: 'John Doe',
    changedAt: '2024-01-01T00:00:00Z',
    changedBy: 'user-1',
    changedByName: 'Admin User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    composable = useDynamicData(TEST_DATA_KEY);
  });

  // ============================================================================
  // INITIALIZATION & STATE
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(composable.schema.value).toBeNull();
      expect(composable.instances.value).toEqual([]);
      expect(composable.instance.value).toBeNull();
      expect(composable.changeHistory.value).toEqual([]);
      expect(composable.pagination.value).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
      expect(composable.loading.value).toBe(false);
      expect(composable.instancesLoading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(composable.instancesError.value).toBeNull();
    });

    it('should initialize computed permissions as false when no schema', () => {
      expect(composable.canRead.value).toBe(false);
      expect(composable.canWrite.value).toBe(false);
      expect(composable.canDelete.value).toBe(false);
    });
  });

  // ============================================================================
  // SCHEMA OPERATIONS
  // ============================================================================

  describe('fetchSchema', () => {
    it('should fetch schema successfully', async () => {
      mockApi.get.mockResolvedValue(mockSchema);

      const result = await composable.fetchSchema();

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/schema`);
      expect(composable.schema.value).toEqual(mockSchema);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(result).toEqual(mockSchema);
    });

    it('should update computed permissions after fetching schema', async () => {
      mockApi.get.mockResolvedValue(mockSchema);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(true);
      expect(composable.canWrite.value).toBe(true);
      expect(composable.canDelete.value).toBe(false);
    });

    it('should handle schema fetch errors', async () => {
      const error = new Error('Failed to fetch schema');
      mockApi.get.mockRejectedValue(error);

      await expect(composable.fetchSchema()).rejects.toThrow(error);

      expect(composable.error.value).toBe('Failed to fetch schema');
      expect(composable.loading.value).toBe(false);
      expect(composable.schema.value).toBeNull();
    });

    it('should set loading state during schema fetch', async () => {
      mockApi.get.mockImplementation(() => {
        expect(composable.loading.value).toBe(true);
        return Promise.resolve(mockSchema);
      });

      await composable.fetchSchema();

      expect(composable.loading.value).toBe(false);
    });

    it('should clear previous error on new schema fetch', async () => {
      composable.error.value = 'Previous error';
      mockApi.get.mockResolvedValue(mockSchema);

      await composable.fetchSchema();

      expect(composable.error.value).toBeNull();
    });
  });

  // ============================================================================
  // INSTANCES - FETCH OPERATIONS
  // ============================================================================

  describe('fetchInstances', () => {
    it('should fetch instances without params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);

      const result = await composable.fetchInstances();

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}?`);
      expect(composable.instances.value).toEqual(mockPaginatedResponse.items);
      expect(composable.pagination.value).toEqual(mockPaginatedResponse.pagination);
      expect(composable.instancesLoading.value).toBe(false);
      expect(composable.instancesError.value).toBeNull();
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch instances with pagination params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);
      const params: QueryParams = { page: 2, limit: 50 };

      await composable.fetchInstances(params);

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}?page=2&limit=50`);
    });

    it('should fetch instances with sorting params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);
      const params: QueryParams = { sortBy: 'createdAt', sortOrder: 'desc' };

      await composable.fetchInstances(params);

      expect(mockApi.get).toHaveBeenCalledWith(
        `/dynamic/${TEST_DATA_KEY}?sortBy=createdAt&sortOrder=desc`
      );
    });

    it('should fetch instances with search param', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);
      const params: QueryParams = { search: 'test query' };

      await composable.fetchInstances(params);

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}?search=test+query`);
    });

    it('should fetch instances with all params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);
      const params: QueryParams = {
        page: 3,
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        search: 'john'
      };

      await composable.fetchInstances(params);

      expect(mockApi.get).toHaveBeenCalledWith(
        `/dynamic/${TEST_DATA_KEY}?page=3&limit=100&sortBy=name&sortOrder=asc&search=john`
      );
    });

    it('should handle fetch instances errors', async () => {
      const error = new Error('Network error');
      mockApi.get.mockRejectedValue(error);

      await expect(composable.fetchInstances()).rejects.toThrow(error);

      expect(composable.instancesError.value).toBe('Network error');
      expect(composable.instancesLoading.value).toBe(false);
    });

    it('should set instancesLoading during fetch', async () => {
      mockApi.get.mockImplementation(() => {
        expect(composable.instancesLoading.value).toBe(true);
        return Promise.resolve(mockPaginatedResponse);
      });

      await composable.fetchInstances();

      expect(composable.instancesLoading.value).toBe(false);
    });
  });

  describe('fetchInstance', () => {
    it('should fetch single instance successfully', async () => {
      mockApi.get.mockResolvedValue(mockInstance);

      const result = await composable.fetchInstance('instance-1');

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/instance-1`);
      expect(composable.instance.value).toEqual(mockInstance);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(result).toEqual(mockInstance);
    });

    it('should handle fetch instance errors', async () => {
      const error = new Error('Instance not found');
      mockApi.get.mockRejectedValue(error);

      await expect(composable.fetchInstance('invalid-id')).rejects.toThrow(error);

      expect(composable.error.value).toBe('Instance not found');
      expect(composable.loading.value).toBe(false);
      expect(composable.instance.value).toBeNull();
    });

    it('should set loading state during instance fetch', async () => {
      mockApi.get.mockImplementation(() => {
        expect(composable.loading.value).toBe(true);
        return Promise.resolve(mockInstance);
      });

      await composable.fetchInstance('instance-1');

      expect(composable.loading.value).toBe(false);
    });
  });

  // ============================================================================
  // INSTANCES - CREATE OPERATION
  // ============================================================================

  describe('createInstance', () => {
    const createDto: CreateInstanceDto = {
      values: {
        name: 'New Instance',
        email: 'new@example.com'
      }
    };

    it('should create instance successfully', async () => {
      const newInstance = { ...mockInstance, id: 'instance-2' };
      mockApi.post.mockResolvedValue(newInstance);

      const result = await composable.createInstance(createDto);

      expect(mockApi.post).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}`, createDto);
      expect(composable.instances.value).toHaveLength(1);
      expect(composable.instances.value[0]).toEqual(newInstance);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(result).toEqual(newInstance);
    });

    it('should add new instance to beginning of instances array', async () => {
      const existingInstance = { ...mockInstance, id: 'existing' };
      const newInstance = { ...mockInstance, id: 'new' };
      composable.instances.value = [existingInstance];
      mockApi.post.mockResolvedValue(newInstance);

      await composable.createInstance(createDto);

      expect(composable.instances.value).toHaveLength(2);
      expect(composable.instances.value[0]).toEqual(newInstance);
      expect(composable.instances.value[1]).toEqual(existingInstance);
    });

    it('should handle create instance errors with response data', async () => {
      const error = {
        response: {
          data: {
            message: 'Validation failed: Name is required'
          }
        },
        message: 'Request failed'
      };
      mockApi.post.mockRejectedValue(error);

      await expect(composable.createInstance(createDto)).rejects.toEqual(error);

      expect(composable.error.value).toBe('Validation failed: Name is required');
      expect(composable.loading.value).toBe(false);
    });

    it('should handle create instance errors without response data', async () => {
      const error = new Error('Network error');
      mockApi.post.mockRejectedValue(error);

      await expect(composable.createInstance(createDto)).rejects.toThrow(error);

      expect(composable.error.value).toBe('Network error');
      expect(composable.loading.value).toBe(false);
    });

    it('should set loading state during create', async () => {
      mockApi.post.mockImplementation(() => {
        expect(composable.loading.value).toBe(true);
        return Promise.resolve(mockInstance);
      });

      await composable.createInstance(createDto);

      expect(composable.loading.value).toBe(false);
    });
  });

  // ============================================================================
  // INSTANCES - UPDATE OPERATION
  // ============================================================================

  describe('updateInstance', () => {
    const updateDto: UpdateInstanceDto = {
      values: {
        name: 'Updated Name'
      }
    };

    it('should update instance successfully', async () => {
      const updatedInstance = { ...mockInstance, values: { name: 'Updated Name' } };
      mockApi.put.mockResolvedValue(updatedInstance);

      const result = await composable.updateInstance('instance-1', updateDto);

      expect(mockApi.put).toHaveBeenCalledWith(
        `/dynamic/${TEST_DATA_KEY}/instance-1`,
        updateDto
      );
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(result).toEqual(updatedInstance);
    });

    it('should update instance in instances array', async () => {
      const originalInstance = { ...mockInstance };
      const updatedInstance = { ...mockInstance, values: { name: 'Updated' } };
      composable.instances.value = [originalInstance];
      mockApi.put.mockResolvedValue(updatedInstance);

      await composable.updateInstance('instance-1', updateDto);

      expect(composable.instances.value).toHaveLength(1);
      expect(composable.instances.value[0]).toEqual(updatedInstance);
    });

    it('should not modify instances array if instance not found', async () => {
      const updatedInstance = { ...mockInstance, id: 'different-id' };
      composable.instances.value = [mockInstance];
      mockApi.put.mockResolvedValue(updatedInstance);

      await composable.updateInstance('different-id', updateDto);

      expect(composable.instances.value).toHaveLength(1);
      expect(composable.instances.value[0]).toEqual(mockInstance);
    });

    it('should update current instance if it matches', async () => {
      const updatedInstance = { ...mockInstance, values: { name: 'Updated' } };
      composable.instance.value = mockInstance;
      mockApi.put.mockResolvedValue(updatedInstance);

      await composable.updateInstance('instance-1', updateDto);

      expect(composable.instance.value).toEqual(updatedInstance);
    });

    it('should not update current instance if it does not match', async () => {
      const originalInstance = { ...mockInstance };
      const updatedInstance = { ...mockInstance, id: 'different-id' };
      composable.instance.value = originalInstance;
      mockApi.put.mockResolvedValue(updatedInstance);

      await composable.updateInstance('different-id', updateDto);

      expect(composable.instance.value).toEqual(originalInstance);
    });

    it('should handle update instance errors with response data', async () => {
      const error = {
        response: {
          data: {
            message: 'Validation failed'
          }
        },
        message: 'Request failed'
      };
      mockApi.put.mockRejectedValue(error);

      await expect(composable.updateInstance('instance-1', updateDto)).rejects.toEqual(error);

      expect(composable.error.value).toBe('Validation failed');
      expect(composable.loading.value).toBe(false);
    });

    it('should handle update instance errors without response data', async () => {
      const error = new Error('Network error');
      mockApi.put.mockRejectedValue(error);

      await expect(composable.updateInstance('instance-1', updateDto)).rejects.toThrow(error);

      expect(composable.error.value).toBe('Network error');
    });
  });

  // ============================================================================
  // INSTANCES - DELETE OPERATION
  // ============================================================================

  describe('deleteInstance', () => {
    it('should delete instance successfully', async () => {
      composable.instances.value = [mockInstance];
      mockApi.delete.mockResolvedValue({});

      await composable.deleteInstance('instance-1');

      expect(mockApi.delete).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/instance-1`);
      expect(composable.instances.value).toHaveLength(0);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
    });

    it('should remove instance from instances array', async () => {
      const instance1 = { ...mockInstance, id: 'instance-1' };
      const instance2 = { ...mockInstance, id: 'instance-2' };
      composable.instances.value = [instance1, instance2];
      mockApi.delete.mockResolvedValue({});

      await composable.deleteInstance('instance-1');

      expect(composable.instances.value).toHaveLength(1);
      expect(composable.instances.value[0]).toEqual(instance2);
    });

    it('should clear current instance if it matches deleted instance', async () => {
      composable.instance.value = mockInstance;
      mockApi.delete.mockResolvedValue({});

      await composable.deleteInstance('instance-1');

      expect(composable.instance.value).toBeNull();
    });

    it('should not clear current instance if it does not match', async () => {
      const differentInstance = { ...mockInstance, id: 'different' };
      composable.instance.value = differentInstance;
      mockApi.delete.mockResolvedValue({});

      await composable.deleteInstance('instance-1');

      expect(composable.instance.value).toEqual(differentInstance);
    });

    it('should handle delete instance errors', async () => {
      const error = new Error('Failed to delete');
      mockApi.delete.mockRejectedValue(error);

      await expect(composable.deleteInstance('instance-1')).rejects.toThrow(error);

      expect(composable.error.value).toBe('Failed to delete');
      expect(composable.loading.value).toBe(false);
    });

    it('should not modify instances on delete error', async () => {
      composable.instances.value = [mockInstance];
      const error = new Error('Delete failed');
      mockApi.delete.mockRejectedValue(error);

      await expect(composable.deleteInstance('instance-1')).rejects.toThrow(error);

      expect(composable.instances.value).toHaveLength(1);
      expect(composable.instances.value[0]).toEqual(mockInstance);
    });
  });

  // ============================================================================
  // ADVANCED FEATURES - SEARCH
  // ============================================================================

  describe('searchInstances', () => {
    it('should search instances with filters only', async () => {
      mockApi.post.mockResolvedValue(mockPaginatedResponse);
      const filters = [
        { field: 'name', operator: 'contains', value: 'John' }
      ];

      const result = await composable.searchInstances(filters);

      expect(mockApi.post).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/search`, {
        filters
      });
      expect(composable.instances.value).toEqual(mockPaginatedResponse.items);
      expect(composable.pagination.value).toEqual(mockPaginatedResponse.pagination);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should search instances with filters and params', async () => {
      mockApi.post.mockResolvedValue(mockPaginatedResponse);
      const filters = [
        { field: 'status', operator: 'equals', value: 'active' }
      ];
      const params: QueryParams = {
        page: 2,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      await composable.searchInstances(filters, params);

      expect(mockApi.post).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/search`, {
        filters,
        ...params
      });
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockApi.post.mockRejectedValue(error);

      await expect(composable.searchInstances([])).rejects.toThrow(error);

      expect(composable.error.value).toBe('Search failed');
      expect(composable.loading.value).toBe(false);
    });

    it('should set loading state during search', async () => {
      mockApi.post.mockImplementation(() => {
        expect(composable.loading.value).toBe(true);
        return Promise.resolve(mockPaginatedResponse);
      });

      await composable.searchInstances([]);

      expect(composable.loading.value).toBe(false);
    });
  });

  // ============================================================================
  // ADVANCED FEATURES - EXPORT
  // ============================================================================

  describe('exportToCSV', () => {
    beforeEach(() => {
      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };
    });

    it('should trigger CSV export without params', async () => {
      await composable.exportToCSV();

      expect(window.location.href).toBe(`/dynamic/${TEST_DATA_KEY}/export/csv?`);
      expect(composable.loading.value).toBe(false);
    });

    it('should trigger CSV export with search param', async () => {
      const params: QueryParams = { search: 'test query' };

      await composable.exportToCSV(params);

      expect(window.location.href).toBe(`/dynamic/${TEST_DATA_KEY}/export/csv?search=test+query`);
    });

    it('should handle CSV export errors', async () => {
      const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw new Error('Export failed');
        },
        configurable: true
      });

      await expect(composable.exportToCSV()).rejects.toThrow('Export failed');

      expect(composable.error.value).toBe('Export failed');
      expect(composable.loading.value).toBe(false);

      // Restore original property descriptor
      if (originalHref) {
        Object.defineProperty(window.location, 'href', originalHref);
      }
    });
  });

  describe('exportToJSON', () => {
    it('should export to JSON without params', async () => {
      const mockData = [mockInstance];
      mockApi.get.mockResolvedValue(mockData);

      const result = await composable.exportToJSON();

      expect(mockApi.get).toHaveBeenCalledWith(`/dynamic/${TEST_DATA_KEY}/export/json?`);
      expect(result).toEqual(mockData);
      expect(composable.loading.value).toBe(false);
    });

    it('should export to JSON with search param', async () => {
      const mockData = [mockInstance];
      mockApi.get.mockResolvedValue(mockData);
      const params: QueryParams = { search: 'john' };

      await composable.exportToJSON(params);

      expect(mockApi.get).toHaveBeenCalledWith(
        `/dynamic/${TEST_DATA_KEY}/export/json?search=john`
      );
    });

    it('should handle JSON export errors', async () => {
      const error = new Error('Export failed');
      mockApi.get.mockRejectedValue(error);

      await expect(composable.exportToJSON()).rejects.toThrow(error);

      expect(composable.error.value).toBe('Export failed');
      expect(composable.loading.value).toBe(false);
    });
  });

  describe('exportCSV (alias)', () => {
    beforeEach(() => {
      delete (window as any).location;
      (window as any).location = { href: '' };
    });

    it('should be an alias for exportToCSV', async () => {
      const params: QueryParams = { search: 'test' };

      await composable.exportCSV(params);

      expect(window.location.href).toBe(`/dynamic/${TEST_DATA_KEY}/export/csv?search=test`);
    });
  });

  // ============================================================================
  // ADVANCED FEATURES - CHANGE HISTORY
  // ============================================================================

  describe('fetchChangeHistory', () => {
    it('should fetch change history successfully', async () => {
      const mockHistory = [mockChangeLogEntry];
      mockApi.get.mockResolvedValue(mockHistory);

      const result = await composable.fetchChangeHistory('instance-1');

      expect(mockApi.get).toHaveBeenCalledWith(
        `/dynamic/${TEST_DATA_KEY}/instance-1/history`
      );
      expect(composable.changeHistory.value).toEqual(mockHistory);
      expect(composable.loading.value).toBe(false);
      expect(composable.error.value).toBeNull();
      expect(result).toEqual(mockHistory);
    });

    it('should handle fetch history errors', async () => {
      const error = new Error('History not found');
      mockApi.get.mockRejectedValue(error);

      await expect(composable.fetchChangeHistory('instance-1')).rejects.toThrow(error);

      expect(composable.error.value).toBe('History not found');
      expect(composable.loading.value).toBe(false);
    });

    it('should set loading state during history fetch', async () => {
      mockApi.get.mockImplementation(() => {
        expect(composable.loading.value).toBe(true);
        return Promise.resolve([mockChangeLogEntry]);
      });

      await composable.fetchChangeHistory('instance-1');

      expect(composable.loading.value).toBe(false);
    });

    it('should handle empty history', async () => {
      mockApi.get.mockResolvedValue([]);

      const result = await composable.fetchChangeHistory('instance-1');

      expect(composable.changeHistory.value).toEqual([]);
      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  describe('computed permissions', () => {
    it('should return false for all permissions when schema is null', () => {
      expect(composable.canRead.value).toBe(false);
      expect(composable.canWrite.value).toBe(false);
      expect(composable.canDelete.value).toBe(false);
    });

    it('should return false for all permissions when permissions object is missing', async () => {
      const schemaWithoutPermissions = { ...mockSchema };
      delete schemaWithoutPermissions.permissions;
      mockApi.get.mockResolvedValue(schemaWithoutPermissions);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(false);
      expect(composable.canWrite.value).toBe(false);
      expect(composable.canDelete.value).toBe(false);
    });

    it('should correctly reflect canRead permission', async () => {
      const schema = {
        ...mockSchema,
        permissions: { canRead: true, canWrite: false, canDelete: false }
      };
      mockApi.get.mockResolvedValue(schema);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(true);
      expect(composable.canWrite.value).toBe(false);
      expect(composable.canDelete.value).toBe(false);
    });

    it('should correctly reflect canWrite permission', async () => {
      const schema = {
        ...mockSchema,
        permissions: { canRead: false, canWrite: true, canDelete: false }
      };
      mockApi.get.mockResolvedValue(schema);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(false);
      expect(composable.canWrite.value).toBe(true);
      expect(composable.canDelete.value).toBe(false);
    });

    it('should correctly reflect canDelete permission', async () => {
      const schema = {
        ...mockSchema,
        permissions: { canRead: false, canWrite: false, canDelete: true }
      };
      mockApi.get.mockResolvedValue(schema);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(false);
      expect(composable.canWrite.value).toBe(false);
      expect(composable.canDelete.value).toBe(true);
    });

    it('should correctly reflect all permissions enabled', async () => {
      const schema = {
        ...mockSchema,
        permissions: { canRead: true, canWrite: true, canDelete: true }
      };
      mockApi.get.mockResolvedValue(schema);

      await composable.fetchSchema();

      expect(composable.canRead.value).toBe(true);
      expect(composable.canWrite.value).toBe(true);
      expect(composable.canDelete.value).toBe(true);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should clear error on successful operation after failure', async () => {
      const error = new Error('Failed');
      mockApi.get.mockRejectedValueOnce(error);
      mockApi.get.mockResolvedValueOnce(mockSchema);

      await expect(composable.fetchSchema()).rejects.toThrow(error);
      expect(composable.error.value).toBe('Failed');

      await composable.fetchSchema();
      expect(composable.error.value).toBeNull();
    });

    it('should handle errors without message property', async () => {
      mockApi.get.mockRejectedValue({});

      await expect(composable.fetchSchema()).rejects.toEqual({});

      expect(composable.error.value).toBe('Failed to fetch schema');
    });

    it('should separate loading and instancesLoading states', async () => {
      mockApi.get.mockImplementation((url: string) => {
        if (url.includes('/schema')) {
          expect(composable.loading.value).toBe(true);
          expect(composable.instancesLoading.value).toBe(false);
          return Promise.resolve(mockSchema);
        }
        expect(composable.instancesLoading.value).toBe(true);
        expect(composable.loading.value).toBe(false);
        return Promise.resolve(mockPaginatedResponse);
      });

      await composable.fetchSchema();
      await composable.fetchInstances();

      expect(composable.loading.value).toBe(false);
      expect(composable.instancesLoading.value).toBe(false);
    });

    it('should separate error and instancesError states', async () => {
      const schemaError = new Error('Schema error');
      const instancesError = new Error('Instances error');

      mockApi.get.mockRejectedValueOnce(schemaError);
      await expect(composable.fetchSchema()).rejects.toThrow(schemaError);
      expect(composable.error.value).toBe('Schema error');
      expect(composable.instancesError.value).toBeNull();

      mockApi.get.mockRejectedValueOnce(instancesError);
      await expect(composable.fetchInstances()).rejects.toThrow(instancesError);
      expect(composable.error.value).toBe('Schema error');
      expect(composable.instancesError.value).toBe('Instances error');
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Fetch schema
      mockApi.get.mockResolvedValueOnce(mockSchema);
      await composable.fetchSchema();
      expect(composable.schema.value).toEqual(mockSchema);

      // Fetch instances
      mockApi.get.mockResolvedValueOnce(mockPaginatedResponse);
      await composable.fetchInstances();
      expect(composable.instances.value).toHaveLength(1);

      // Create new instance
      const newInstance = { ...mockInstance, id: 'instance-2' };
      mockApi.post.mockResolvedValueOnce(newInstance);
      await composable.createInstance({ values: { name: 'New' } });
      expect(composable.instances.value).toHaveLength(2);

      // Update instance
      const updatedInstance = { ...newInstance, values: { name: 'Updated' } };
      mockApi.put.mockResolvedValueOnce(updatedInstance);
      await composable.updateInstance('instance-2', { values: { name: 'Updated' } });
      expect(composable.instances.value[0]).toEqual(updatedInstance);

      // Delete instance
      mockApi.delete.mockResolvedValueOnce({});
      await composable.deleteInstance('instance-2');
      expect(composable.instances.value).toHaveLength(1);
    });

    it('should maintain data consistency across operations', async () => {
      const instances = [
        { ...mockInstance, id: '1' },
        { ...mockInstance, id: '2' },
        { ...mockInstance, id: '3' }
      ];
      composable.instances.value = [...instances];

      // Update middle instance
      const updated = { ...instances[1], values: { name: 'Updated' } };
      mockApi.put.mockResolvedValueOnce(updated);
      await composable.updateInstance('2', { values: { name: 'Updated' } });

      expect(composable.instances.value).toHaveLength(3);
      expect(composable.instances.value[1]).toEqual(updated);
      expect(composable.instances.value[0]).toEqual(instances[0]);
      expect(composable.instances.value[2]).toEqual(instances[2]);

      // Delete first instance
      mockApi.delete.mockResolvedValueOnce({});
      await composable.deleteInstance('1');

      expect(composable.instances.value).toHaveLength(2);
      expect(composable.instances.value[0]).toEqual(updated);
      expect(composable.instances.value[1]).toEqual(instances[2]);
    });
  });
});
