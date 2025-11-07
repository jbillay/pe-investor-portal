import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDataInstances } from '../useDataInstances';
import type {
  DynamicInstance,
  DynamicSchema,
  PaginatedInstances,
  CreateInstanceDto,
  UpdateInstanceDto,
  QueryParams
} from '@/types/dynamic-data';

// Mock the useApi composable
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('../../useApi', () => ({
  useApi: () => ({ api: mockApi })
}));

describe('useDataInstances', () => {
  // Mock data
  const mockSchema: DynamicSchema = {
    dataObjectId: 'obj-1',
    name: 'Test Object',
    pluralName: 'Test Objects',
    fields: [
      {
        id: 'field-1',
        name: 'name',
        label: 'Name',
        dataType: 'text',
        isRequired: true,
        isUnique: false,
        defaultValue: null,
        validationRules: null,
        displayOrder: 1
      }
    ]
  };

  const mockInstance: DynamicInstance = {
    id: 'inst-1',
    dataObjectId: 'obj-1',
    data: {
      name: 'Test Instance'
    },
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  const mockInstance2: DynamicInstance = {
    id: 'inst-2',
    dataObjectId: 'obj-1',
    data: {
      name: 'Test Instance 2'
    },
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  const mockPaginatedResponse: PaginatedInstances = {
    items: [mockInstance, mockInstance2],
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  };

  const mockCreateDto: CreateInstanceDto = {
    data: {
      name: 'New Instance'
    }
  };

  const mockUpdateDto: UpdateInstanceDto = {
    data: {
      name: 'Updated Instance'
    }
  };

  const mockQueryParams: QueryParams = {
    page: '1',
    limit: '10',
    search: 'test'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { instances, currentInstance, schema, pagination, loading, error } = useDataInstances();

      expect(instances.value).toEqual([]);
      expect(currentInstance.value).toBeNull();
      expect(schema.value).toBeNull();
      expect(pagination.value).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('fetchSchema', () => {
    it('should fetch schema successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockSchema });

      const { fetchSchema, schema, loading } = useDataInstances();

      const result = await fetchSchema('obj-1');

      expect(mockApi.get).toHaveBeenCalledWith('/data/obj-1/schema');
      expect(schema.value).toEqual(mockSchema);
      expect(result).toEqual(mockSchema);
      expect(loading.value).toBe(false);
    });

    it('should handle unwrapped response', async () => {
      mockApi.get.mockResolvedValue(mockSchema);

      const { fetchSchema, schema } = useDataInstances();

      const result = await fetchSchema('obj-1');

      expect(schema.value).toEqual(mockSchema);
      expect(result).toEqual(mockSchema);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return mockSchema;
      });

      const { fetchSchema, loading } = useDataInstances();

      await fetchSchema('obj-1');

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Schema not found';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchSchema, error } = useDataInstances();

      await expect(fetchSchema('obj-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });

    it('should clear error on successful fetch', async () => {
      mockApi.get.mockResolvedValue(mockSchema);

      const { fetchSchema, error } = useDataInstances();

      await fetchSchema('obj-1');

      expect(error.value).toBeNull();
    });
  });

  describe('fetchInstances', () => {
    it('should fetch instances without query params', async () => {
      mockApi.get.mockResolvedValue({ data: mockPaginatedResponse });

      const { fetchInstances, instances, pagination } = useDataInstances();

      const result = await fetchInstances('obj-1');

      expect(mockApi.get).toHaveBeenCalledWith('/data/obj-1/instances');
      expect(instances.value).toEqual([mockInstance, mockInstance2]);
      expect(pagination.value).toEqual(mockPaginatedResponse.pagination);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch instances with query params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);

      const { fetchInstances } = useDataInstances();

      await fetchInstances('obj-1', mockQueryParams);

      expect(mockApi.get).toHaveBeenCalledWith('/data/obj-1/instances?page=1&limit=10&search=test');
    });

    it('should handle unwrapped response', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);

      const { fetchInstances, instances } = useDataInstances();

      const result = await fetchInstances('obj-1');

      expect(instances.value).toEqual([mockInstance, mockInstance2]);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle response without pagination', async () => {
      const responseWithoutPagination = {
        items: [mockInstance]
      };
      mockApi.get.mockResolvedValue(responseWithoutPagination);

      const { fetchInstances, instances, pagination } = useDataInstances();

      const originalPagination = { ...pagination.value };

      await fetchInstances('obj-1');

      expect(instances.value).toEqual([mockInstance]);
      expect(pagination.value).toEqual(originalPagination); // Unchanged
    });

    it('should handle empty items array', async () => {
      mockApi.get.mockResolvedValue({ items: [], pagination: mockPaginatedResponse.pagination });

      const { fetchInstances, instances } = useDataInstances();

      await fetchInstances('obj-1');

      expect(instances.value).toEqual([]);
    });

    it('should handle response without items', async () => {
      mockApi.get.mockResolvedValue({});

      const { fetchInstances, instances } = useDataInstances();

      await fetchInstances('obj-1');

      expect(instances.value).toEqual([]);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return mockPaginatedResponse;
      });

      const { fetchInstances, loading } = useDataInstances();

      await fetchInstances('obj-1');

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchInstances, error } = useDataInstances();

      await expect(fetchInstances('obj-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('fetchInstance', () => {
    it('should fetch single instance successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockInstance });

      const { fetchInstance, currentInstance } = useDataInstances();

      const result = await fetchInstance('obj-1', 'inst-1');

      expect(mockApi.get).toHaveBeenCalledWith('/data/obj-1/instances/inst-1');
      expect(currentInstance.value).toEqual(mockInstance);
      expect(result).toEqual(mockInstance);
    });


    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return mockInstance;
      });

      const { fetchInstance, loading } = useDataInstances();

      await fetchInstance('obj-1', 'inst-1');

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Instance not found';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchInstance, error } = useDataInstances();

      await expect(fetchInstance('obj-1', 'inst-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('createInstance', () => {
    it('should create instance and add to beginning of array', async () => {
      const newInstance = { ...mockInstance, id: 'inst-new' };
      mockApi.post.mockResolvedValue({ data: newInstance });

      const { createInstance, instances } = useDataInstances();

      // Setup initial instances
      instances.value = [mockInstance, mockInstance2];

      const result = await createInstance('obj-1', mockCreateDto);

      expect(mockApi.post).toHaveBeenCalledWith('/data/obj-1/instances', mockCreateDto);
      expect(instances.value[0]).toEqual(newInstance); // At beginning
      expect(instances.value).toHaveLength(3);
      expect(result).toEqual(newInstance);
    });


    it('should initialize instances as array if null', async () => {
      const newInstance = { ...mockInstance, id: 'inst-new' };
      mockApi.post.mockResolvedValue({ data: newInstance });

      const { createInstance, instances } = useDataInstances();

      // Force null state
      instances.value = null as any;

      await createInstance('obj-1', mockCreateDto);

      expect(Array.isArray(instances.value)).toBe(true);
      expect(instances.value[0].id).toEqual('inst-new');
    });

    it('should set loading state during create', async () => {
      let loadingDuringCreate = false;
      mockApi.post.mockImplementation(async () => {
        loadingDuringCreate = loading.value;
        return mockInstance;
      });

      const { createInstance, loading } = useDataInstances();

      await createInstance('obj-1', mockCreateDto);

      expect(loadingDuringCreate).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle create error', async () => {
      const errorMessage = 'Validation failed';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      const { createInstance, error } = useDataInstances();

      await expect(createInstance('obj-1', mockCreateDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('updateInstance', () => {
    it('should update instance in array and currentInstance', async () => {
      const updatedInstance = { ...mockInstance, data: { name: 'Updated' } };
      mockApi.put.mockResolvedValue({ data: updatedInstance });

      const { updateInstance, instances, currentInstance } = useDataInstances();

      // Setup initial state
      instances.value = [mockInstance, mockInstance2];
      currentInstance.value = mockInstance;

      const result = await updateInstance('obj-1', 'inst-1', mockUpdateDto);

      expect(mockApi.put).toHaveBeenCalledWith('/data/obj-1/instances/inst-1', mockUpdateDto);
      expect(instances.value[0]).toEqual(updatedInstance);
      expect(currentInstance.value).toEqual(updatedInstance);
      expect(result).toEqual(updatedInstance);
    });

    it('should handle update when instance not in array', async () => {
      const updatedInstance = { ...mockInstance, data: { name: 'Updated' } };
      mockApi.put.mockResolvedValue(updatedInstance);

      const { updateInstance, instances } = useDataInstances();

      instances.value = [mockInstance2]; // inst-1 not in array

      await updateInstance('obj-1', 'inst-1', mockUpdateDto);

      expect(instances.value).not.toContainEqual(updatedInstance);
    });

    it('should not update currentInstance if different ID', async () => {
      const updatedInstance = { ...mockInstance2, data: { name: 'Updated' } };
      mockApi.put.mockResolvedValue(updatedInstance);

      const { updateInstance, currentInstance, instances } = useDataInstances();

      instances.value = [mockInstance, mockInstance2];
      currentInstance.value = mockInstance; // Different ID

      await updateInstance('obj-1', 'inst-2', mockUpdateDto);

      expect(currentInstance.value).toEqual(mockInstance);
    });

    it('should set loading state during update', async () => {
      let loadingDuringUpdate = false;
      mockApi.put.mockImplementation(async () => {
        loadingDuringUpdate = loading.value;
        return mockInstance;
      });

      const { updateInstance, loading, instances } = useDataInstances();

      instances.value = [mockInstance];

      await updateInstance('obj-1', 'inst-1', mockUpdateDto);

      expect(loadingDuringUpdate).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle update error', async () => {
      const errorMessage = 'Conflict';
      mockApi.put.mockRejectedValue(new Error(errorMessage));

      const { updateInstance, error } = useDataInstances();

      await expect(updateInstance('obj-1', 'inst-1', mockUpdateDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('deleteInstance', () => {
    it('should delete instance from array', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteInstance, instances } = useDataInstances();

      instances.value = [mockInstance, mockInstance2];

      await deleteInstance('obj-1', 'inst-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/data/obj-1/instances/inst-1');
      expect(instances.value).toEqual([mockInstance2]);
    });

    it('should clear currentInstance if deleted', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteInstance, currentInstance, instances } = useDataInstances();

      instances.value = [mockInstance];
      currentInstance.value = mockInstance;

      await deleteInstance('obj-1', 'inst-1');

      expect(currentInstance.value).toBeNull();
    });

    it('should not clear currentInstance if different ID', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteInstance, currentInstance, instances } = useDataInstances();

      instances.value = [mockInstance, mockInstance2];
      currentInstance.value = mockInstance;

      await deleteInstance('obj-1', 'inst-2');

      expect(currentInstance.value).toEqual(mockInstance);
    });

    it('should set loading state during delete', async () => {
      let loadingDuringDelete = false;
      mockApi.delete.mockImplementation(async () => {
        loadingDuringDelete = loading.value;
        return {};
      });

      const { deleteInstance, loading, instances } = useDataInstances();

      instances.value = [mockInstance];

      await deleteInstance('obj-1', 'inst-1');

      expect(loadingDuringDelete).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle delete error', async () => {
      const errorMessage = 'Cannot delete';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      const { deleteInstance, error } = useDataInstances();

      await expect(deleteInstance('obj-1', 'inst-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('Error Handling', () => {
    it('should set default error message when error has no message', async () => {
      mockApi.get.mockRejectedValue({});

      const { fetchSchema, error } = useDataInstances();

      await expect(fetchSchema('obj-1')).rejects.toBeDefined();
      expect(error.value).toBe('Failed to fetch schema');
    });

    it('should clear error on subsequent successful operation', async () => {
      // First call fails
      mockApi.get.mockRejectedValueOnce(new Error('First error'));
      // Second call succeeds
      mockApi.get.mockResolvedValue(mockSchema);

      const { fetchSchema, error } = useDataInstances();

      await expect(fetchSchema('obj-1')).rejects.toThrow('First error');
      expect(error.value).toBe('First error');

      await fetchSchema('obj-1');
      expect(error.value).toBeNull();
    });

    it('should use specific error messages for each operation', async () => {
      const { fetchInstances, createInstance, updateInstance, deleteInstance, error } = useDataInstances();

      mockApi.get.mockRejectedValue({});
      await expect(fetchInstances('obj-1')).rejects.toBeDefined();
      expect(error.value).toBe('Failed to fetch instances');

      mockApi.post.mockRejectedValue({});
      await expect(createInstance('obj-1', mockCreateDto)).rejects.toBeDefined();
      expect(error.value).toBe('Failed to create instance');

      mockApi.put.mockRejectedValue({});
      await expect(updateInstance('obj-1', 'inst-1', mockUpdateDto)).rejects.toBeDefined();
      expect(error.value).toBe('Failed to update instance');

      mockApi.delete.mockRejectedValue({});
      await expect(deleteInstance('obj-1', 'inst-1')).rejects.toBeDefined();
      expect(error.value).toBe('Failed to delete instance');
    });
  });

  describe('Query Params Handling', () => {
    it('should handle query params with special characters', async () => {
      const specialParams: QueryParams = {
        search: 'test & value',
        filter: 'key=value'
      };

      mockApi.get.mockResolvedValue(mockPaginatedResponse);

      const { fetchInstances } = useDataInstances();

      await fetchInstances('obj-1', specialParams);

      // URLSearchParams will encode special characters
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/data\/obj-1\/instances\?/)
      );
    });

    it('should handle empty query params', async () => {
      mockApi.get.mockResolvedValue(mockPaginatedResponse);

      const { fetchInstances } = useDataInstances();

      await fetchInstances('obj-1', {});

      expect(mockApi.get).toHaveBeenCalledWith('/data/obj-1/instances?');
    });
  });
});
