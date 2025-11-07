import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDataObjects } from '../useDataObjects';
import type {
  DataObject,
  CreateDataObjectDto,
  UpdateDataObjectDto,
  CreateFieldDto,
  UpdateFieldDto,
  DataObjectVersion
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

describe('useDataObjects', () => {
  // Mock data
  const mockDataObject: DataObject = {
    id: 'obj-1',
    name: 'Test Object',
    pluralName: 'Test Objects',
    description: 'A test data object',
    tableName: 'test_objects',
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
    ],
    version: 1,
    isActive: true,
    isSystem: false,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z'
  };

  const mockDataObject2: DataObject = {
    ...mockDataObject,
    id: 'obj-2',
    name: 'Test Object 2'
  };

  const mockCreateDto: CreateDataObjectDto = {
    name: 'New Object',
    pluralName: 'New Objects',
    description: 'A new data object',
    fields: []
  };

  const mockUpdateDto: UpdateDataObjectDto = {
    name: 'Updated Object',
    description: 'An updated data object'
  };

  const mockCreateFieldDto: CreateFieldDto = {
    name: 'email',
    label: 'Email',
    dataType: 'email',
    isRequired: true,
    isUnique: true,
    displayOrder: 2
  };

  const mockUpdateFieldDto: UpdateFieldDto = {
    label: 'Email Address',
    isRequired: false
  };

  const mockVersion: DataObjectVersion = {
    id: 'version-1',
    dataObjectId: 'obj-1',
    version: 1,
    changes: { name: 'Test Object' },
    createdBy: 'user-1',
    createdAt: '2025-01-01T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { dataObjects, currentDataObject, versions, loading, error } = useDataObjects();

      expect(dataObjects.value).toEqual([]);
      expect(currentDataObject.value).toBeNull();
      expect(versions.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe('fetchDataObjects', () => {
    it('should fetch data objects successfully from array response', async () => {
      mockApi.get.mockResolvedValue([mockDataObject, mockDataObject2]);

      const { fetchDataObjects, dataObjects, loading } = useDataObjects();

      const result = await fetchDataObjects();

      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects');
      expect(dataObjects.value).toEqual([mockDataObject, mockDataObject2]);
      expect(result).toEqual([mockDataObject, mockDataObject2]);
      expect(loading.value).toBe(false);
    });

    it('should fetch data objects successfully from wrapped response', async () => {
      mockApi.get.mockResolvedValue({ data: [mockDataObject] });

      const { fetchDataObjects, dataObjects } = useDataObjects();

      const result = await fetchDataObjects();

      expect(dataObjects.value).toEqual([mockDataObject]);
      expect(result).toEqual([mockDataObject]);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return [mockDataObject];
      });

      const { fetchDataObjects, loading } = useDataObjects();

      await fetchDataObjects();

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchDataObjects, error, dataObjects } = useDataObjects();

      await expect(fetchDataObjects()).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
      expect(dataObjects.value).toEqual([]);
    });

    it('should clear error on successful fetch', async () => {
      mockApi.get.mockResolvedValue([mockDataObject]);

      const { fetchDataObjects, error } = useDataObjects();

      await fetchDataObjects();

      expect(error.value).toBeNull();
    });
  });

  describe('fetchDataObject', () => {
    it('should fetch single data object successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockDataObject });

      const { fetchDataObject, currentDataObject } = useDataObjects();

      const result = await fetchDataObject('obj-1');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1');
      expect(currentDataObject.value).toEqual(mockDataObject);
      expect(result).toEqual(mockDataObject);
    });

    it('should handle unwrapped response', async () => {
      mockApi.get.mockResolvedValue(mockDataObject);

      const { fetchDataObject, currentDataObject } = useDataObjects();

      const result = await fetchDataObject('obj-1');

      expect(currentDataObject.value).toEqual(mockDataObject);
      expect(result).toEqual(mockDataObject);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return mockDataObject;
      });

      const { fetchDataObject, loading } = useDataObjects();

      await fetchDataObject('obj-1');

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Not found';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchDataObject, error } = useDataObjects();

      await expect(fetchDataObject('obj-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('createDataObject', () => {
    it('should create data object successfully', async () => {
      const newObject = { ...mockDataObject, id: 'obj-new' };
      mockApi.post.mockResolvedValue({ data: newObject });

      const { createDataObject, dataObjects } = useDataObjects();

      const result = await createDataObject(mockCreateDto);

      expect(mockApi.post).toHaveBeenCalledWith('/admin/data-objects', mockCreateDto);
      expect(dataObjects.value).toContainEqual(newObject);
      expect(result).toEqual(newObject);
    });

    it('should handle unwrapped response', async () => {
      const newObject = { ...mockDataObject, id: 'obj-new' };
      mockApi.post.mockResolvedValue(newObject);

      const { createDataObject, dataObjects } = useDataObjects();

      const result = await createDataObject(mockCreateDto);

      expect(dataObjects.value).toContainEqual(newObject);
      expect(result).toEqual(newObject);
    });

    it('should initialize dataObjects as array if null', async () => {
      const newObject = { ...mockDataObject, id: 'obj-new' };
      mockApi.post.mockResolvedValue(newObject);

      const { createDataObject, dataObjects } = useDataObjects();

      // Force null state
      dataObjects.value = null as any;

      await createDataObject(mockCreateDto);

      expect(Array.isArray(dataObjects.value)).toBe(true);
      expect(dataObjects.value).toContainEqual(newObject);
    });

    it('should set loading state during create', async () => {
      let loadingDuringCreate = false;
      mockApi.post.mockImplementation(async () => {
        loadingDuringCreate = loading.value;
        return mockDataObject;
      });

      const { createDataObject, loading } = useDataObjects();

      await createDataObject(mockCreateDto);

      expect(loadingDuringCreate).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle create error', async () => {
      const errorMessage = 'Validation failed';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      const { createDataObject, error } = useDataObjects();

      await expect(createDataObject(mockCreateDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('updateDataObject', () => {
    it('should update data object in array and currentDataObject', async () => {
      const updatedObject = { ...mockDataObject, name: 'Updated' };
      mockApi.put.mockResolvedValue({ data: updatedObject });

      const { updateDataObject, dataObjects, currentDataObject } = useDataObjects();

      // Setup initial state
      dataObjects.value = [mockDataObject, mockDataObject2];
      currentDataObject.value = mockDataObject;

      const result = await updateDataObject('obj-1', mockUpdateDto);

      expect(mockApi.put).toHaveBeenCalledWith('/admin/data-objects/obj-1', mockUpdateDto);
      expect(dataObjects.value[0]).toEqual(updatedObject);
      expect(currentDataObject.value).toEqual(updatedObject);
      expect(result).toEqual(updatedObject);
    });

    it('should handle update when object not in array', async () => {
      const updatedObject = { ...mockDataObject, name: 'Updated' };
      mockApi.put.mockResolvedValue(updatedObject);

      const { updateDataObject, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject2]; // obj-1 not in array

      await updateDataObject('obj-1', mockUpdateDto);

      expect(dataObjects.value).not.toContainEqual(updatedObject);
    });

    it('should not update currentDataObject if different ID', async () => {
      const updatedObject = { ...mockDataObject2, name: 'Updated' };
      mockApi.put.mockResolvedValue(updatedObject);

      const { updateDataObject, currentDataObject, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject, mockDataObject2];
      currentDataObject.value = mockDataObject; // Different ID

      await updateDataObject('obj-2', mockUpdateDto);

      expect(currentDataObject.value).toEqual(mockDataObject);
    });

    it('should set loading state during update', async () => {
      let loadingDuringUpdate = false;
      mockApi.put.mockImplementation(async () => {
        loadingDuringUpdate = loading.value;
        return mockDataObject;
      });

      const { updateDataObject, loading, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject];

      await updateDataObject('obj-1', mockUpdateDto);

      expect(loadingDuringUpdate).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle update error', async () => {
      const errorMessage = 'Conflict';
      mockApi.put.mockRejectedValue(new Error(errorMessage));

      const { updateDataObject, error } = useDataObjects();

      await expect(updateDataObject('obj-1', mockUpdateDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('deleteDataObject', () => {
    it('should delete data object from array', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteDataObject, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject, mockDataObject2];

      await deleteDataObject('obj-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/admin/data-objects/obj-1');
      expect(dataObjects.value).toEqual([mockDataObject2]);
    });

    it('should clear currentDataObject if deleted', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteDataObject, currentDataObject, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject];
      currentDataObject.value = mockDataObject;

      await deleteDataObject('obj-1');

      expect(currentDataObject.value).toBeNull();
    });

    it('should not clear currentDataObject if different ID', async () => {
      mockApi.delete.mockResolvedValue({});

      const { deleteDataObject, currentDataObject, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject, mockDataObject2];
      currentDataObject.value = mockDataObject;

      await deleteDataObject('obj-2');

      expect(currentDataObject.value).toEqual(mockDataObject);
    });

    it('should set loading state during delete', async () => {
      let loadingDuringDelete = false;
      mockApi.delete.mockImplementation(async () => {
        loadingDuringDelete = loading.value;
        return {};
      });

      const { deleteDataObject, loading, dataObjects } = useDataObjects();

      dataObjects.value = [mockDataObject];

      await deleteDataObject('obj-1');

      expect(loadingDuringDelete).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle delete error', async () => {
      const errorMessage = 'Cannot delete';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      const { deleteDataObject, error } = useDataObjects();

      await expect(deleteDataObject('obj-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('addField', () => {
    it('should add field and refresh data object', async () => {
      const fieldResponse = { id: 'field-2', ...mockCreateFieldDto };
      const updatedObject = {
        ...mockDataObject,
        fields: [...mockDataObject.fields, fieldResponse]
      };

      mockApi.post.mockResolvedValue({ data: fieldResponse });
      mockApi.get.mockResolvedValue(updatedObject);

      const { addField, currentDataObject } = useDataObjects();

      const result = await addField('obj-1', mockCreateFieldDto);

      expect(mockApi.post).toHaveBeenCalledWith('/admin/data-objects/obj-1/fields', mockCreateFieldDto);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1');
      expect(currentDataObject.value).toEqual(updatedObject);
      expect(result).toEqual(fieldResponse);
    });

    it('should set loading state during add field', async () => {
      let loadingDuringAdd = false;
      mockApi.post.mockImplementation(async () => {
        loadingDuringAdd = loading.value;
        return { id: 'field-2' };
      });
      mockApi.get.mockResolvedValue(mockDataObject);

      const { addField, loading } = useDataObjects();

      await addField('obj-1', mockCreateFieldDto);

      expect(loadingDuringAdd).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle add field error', async () => {
      const errorMessage = 'Field already exists';
      mockApi.post.mockRejectedValue(new Error(errorMessage));

      const { addField, error } = useDataObjects();

      await expect(addField('obj-1', mockCreateFieldDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('updateField', () => {
    it('should update field and refresh data object', async () => {
      const fieldResponse = { id: 'field-1', ...mockUpdateFieldDto };
      const updatedObject = { ...mockDataObject };

      mockApi.put.mockResolvedValue({ data: fieldResponse });
      mockApi.get.mockResolvedValue(updatedObject);

      const { updateField, currentDataObject } = useDataObjects();

      const result = await updateField('obj-1', 'field-1', mockUpdateFieldDto);

      expect(mockApi.put).toHaveBeenCalledWith('/admin/data-objects/obj-1/fields/field-1', mockUpdateFieldDto);
      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1');
      expect(currentDataObject.value).toEqual(updatedObject);
      expect(result).toEqual(fieldResponse);
    });

    it('should set loading state during update field', async () => {
      let loadingDuringUpdate = false;
      mockApi.put.mockImplementation(async () => {
        loadingDuringUpdate = loading.value;
        return { id: 'field-1' };
      });
      mockApi.get.mockResolvedValue(mockDataObject);

      const { updateField, loading } = useDataObjects();

      await updateField('obj-1', 'field-1', mockUpdateFieldDto);

      expect(loadingDuringUpdate).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle update field error', async () => {
      const errorMessage = 'Invalid field type';
      mockApi.put.mockRejectedValue(new Error(errorMessage));

      const { updateField, error } = useDataObjects();

      await expect(updateField('obj-1', 'field-1', mockUpdateFieldDto)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('deleteField', () => {
    it('should delete field and refresh data object', async () => {
      const updatedObject = {
        ...mockDataObject,
        fields: []
      };

      mockApi.delete.mockResolvedValue({});
      mockApi.get.mockResolvedValue(updatedObject);

      const { deleteField, currentDataObject } = useDataObjects();

      await deleteField('obj-1', 'field-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/admin/data-objects/obj-1/fields/field-1');
      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1');
      expect(currentDataObject.value).toEqual(updatedObject);
    });

    it('should set loading state during delete field', async () => {
      let loadingDuringDelete = false;
      mockApi.delete.mockImplementation(async () => {
        loadingDuringDelete = loading.value;
        return {};
      });
      mockApi.get.mockResolvedValue(mockDataObject);

      const { deleteField, loading } = useDataObjects();

      await deleteField('obj-1', 'field-1');

      expect(loadingDuringDelete).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle delete field error', async () => {
      const errorMessage = 'Field in use';
      mockApi.delete.mockRejectedValue(new Error(errorMessage));

      const { deleteField, error } = useDataObjects();

      await expect(deleteField('obj-1', 'field-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('fetchVersionHistory', () => {
    it('should fetch version history successfully from array', async () => {
      const versionHistory = [mockVersion];
      mockApi.get.mockResolvedValue(versionHistory);

      const { fetchVersionHistory, versions } = useDataObjects();

      const result = await fetchVersionHistory('obj-1');

      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1/versions');
      expect(versions.value).toEqual(versionHistory);
      expect(result).toEqual(versionHistory);
    });

    it('should fetch version history from wrapped response', async () => {
      const versionHistory = [mockVersion];
      mockApi.get.mockResolvedValue({ data: versionHistory });

      const { fetchVersionHistory, versions } = useDataObjects();

      const result = await fetchVersionHistory('obj-1');

      expect(versions.value).toEqual(versionHistory);
      expect(result).toEqual(versionHistory);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return [mockVersion];
      });

      const { fetchVersionHistory, loading } = useDataObjects();

      await fetchVersionHistory('obj-1');

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Version not found';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchVersionHistory, error } = useDataObjects();

      await expect(fetchVersionHistory('obj-1')).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('fetchVersion', () => {
    it('should fetch specific version successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockVersion });

      const { fetchVersion } = useDataObjects();

      const result = await fetchVersion('obj-1', 1);

      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1/versions/1');
      expect(result).toEqual(mockVersion);
    });

    it('should handle unwrapped response', async () => {
      mockApi.get.mockResolvedValue(mockVersion);

      const { fetchVersion } = useDataObjects();

      const result = await fetchVersion('obj-1', 1);

      expect(result).toEqual(mockVersion);
    });

    it('should set loading state during fetch', async () => {
      let loadingDuringFetch = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringFetch = loading.value;
        return mockVersion;
      });

      const { fetchVersion, loading } = useDataObjects();

      await fetchVersion('obj-1', 1);

      expect(loadingDuringFetch).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Version not found';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { fetchVersion, error } = useDataObjects();

      await expect(fetchVersion('obj-1', 1)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('compareVersions', () => {
    it('should compare versions successfully', async () => {
      const comparison = {
        version1: 1,
        version2: 2,
        changes: ['name changed']
      };
      mockApi.get.mockResolvedValue({ data: comparison });

      const { compareVersions } = useDataObjects();

      const result = await compareVersions('obj-1', 1, 2);

      expect(mockApi.get).toHaveBeenCalledWith('/admin/data-objects/obj-1/versions/compare/1/2');
      expect(result).toEqual(comparison);
    });

    it('should handle unwrapped response', async () => {
      const comparison = { changes: [] };
      mockApi.get.mockResolvedValue(comparison);

      const { compareVersions } = useDataObjects();

      const result = await compareVersions('obj-1', 1, 2);

      expect(result).toEqual(comparison);
    });

    it('should set loading state during compare', async () => {
      let loadingDuringCompare = false;
      mockApi.get.mockImplementation(async () => {
        loadingDuringCompare = loading.value;
        return { changes: [] };
      });

      const { compareVersions, loading } = useDataObjects();

      await compareVersions('obj-1', 1, 2);

      expect(loadingDuringCompare).toBe(true);
      expect(loading.value).toBe(false);
    });

    it('should handle compare error', async () => {
      const errorMessage = 'Cannot compare';
      mockApi.get.mockRejectedValue(new Error(errorMessage));

      const { compareVersions, error } = useDataObjects();

      await expect(compareVersions('obj-1', 1, 2)).rejects.toThrow(errorMessage);
      expect(error.value).toBe(errorMessage);
    });
  });

  describe('Error Handling', () => {
    it('should set default error message when error has no message', async () => {
      mockApi.get.mockRejectedValue({});

      const { fetchDataObjects, error } = useDataObjects();

      await expect(fetchDataObjects()).rejects.toBeDefined();
      expect(error.value).toBe('Failed to fetch data objects');
    });

    it('should clear error on subsequent successful operation', async () => {
      // First call fails
      mockApi.get.mockRejectedValueOnce(new Error('First error'));
      // Second call succeeds
      mockApi.get.mockResolvedValue([mockDataObject]);

      const { fetchDataObjects, error } = useDataObjects();

      await expect(fetchDataObjects()).rejects.toThrow('First error');
      expect(error.value).toBe('First error');

      await fetchDataObjects();
      expect(error.value).toBeNull();
    });
  });
});
