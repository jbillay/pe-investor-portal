import { ref } from 'vue';
import { useApi } from '../useApi';
import type {
  DataObject,
  CreateDataObjectDto,
  UpdateDataObjectDto,
  CreateFieldDto,
  UpdateFieldDto,
  DataObjectVersion
} from '@/types/dynamic-data';

export function useDataObjects() {
  const { api } = useApi();

  const dataObjects = ref<DataObject[]>([]);
  const currentDataObject = ref<DataObject | null>(null);
  const versions = ref<DataObjectVersion[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================================================
  // DATA OBJECT CRUD
  // ============================================================================

  const fetchDataObjects = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DataObject[]>('/admin/data-objects');
      // Backend returns array directly, not wrapped in ApiResponse
      const data = Array.isArray(response) ? response : (response as any).data || response;
      dataObjects.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data objects';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchDataObject = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DataObject>(`/admin/data-objects/${id}`);
      const data = (response as any).data || response;
      currentDataObject.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data object';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createDataObject = async (dto: CreateDataObjectDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<DataObject>('/admin/data-objects', dto);
      const data = (response as any).data || response;
      // Ensure dataObjects is initialized as an array
      if (!dataObjects.value) {
        dataObjects.value = [];
      }
      dataObjects.value.push(data);
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create data object';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateDataObject = async (id: string, dto: UpdateDataObjectDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<DataObject>(`/admin/data-objects/${id}`, dto);
      const data = (response as any).data || response;
      const index = dataObjects.value.findIndex(obj => obj.id === id);
      if (index !== -1) {
        dataObjects.value[index] = data;
      }
      if (currentDataObject.value?.id === id) {
        currentDataObject.value = data;
      }
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update data object';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteDataObject = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/admin/data-objects/${id}`);
      dataObjects.value = dataObjects.value.filter(obj => obj.id !== id);
      if (currentDataObject.value?.id === id) {
        currentDataObject.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete data object';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ============================================================================
  // FIELD MANAGEMENT
  // ============================================================================

  const addField = async (dataObjectId: string, dto: CreateFieldDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<any>(`/admin/data-objects/${dataObjectId}/fields`, dto);
      const data = (response as any).data || response;
      // Refresh the data object to get updated fields
      await fetchDataObject(dataObjectId);
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to add field';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateField = async (dataObjectId: string, fieldId: string, dto: UpdateFieldDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<any>(`/admin/data-objects/${dataObjectId}/fields/${fieldId}`, dto);
      const data = (response as any).data || response;
      // Refresh the data object to get updated fields
      await fetchDataObject(dataObjectId);
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update field';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteField = async (dataObjectId: string, fieldId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/admin/data-objects/${dataObjectId}/fields/${fieldId}`);
      // Refresh the data object to get updated fields
      await fetchDataObject(dataObjectId);
    } catch (err: any) {
      error.value = err.message || 'Failed to delete field';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ============================================================================
  // VERSION MANAGEMENT
  // ============================================================================

  const fetchVersionHistory = async (dataObjectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DataObjectVersion[]>(`/admin/data-objects/${dataObjectId}/versions`);
      const data = Array.isArray(response) ? response : (response as any).data || response;
      versions.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch version history';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchVersion = async (dataObjectId: string, version: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<any>(`/admin/data-objects/${dataObjectId}/versions/${version}`);
      const data = (response as any).data || response;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch version';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const compareVersions = async (dataObjectId: string, version1: number, version2: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<any>(`/admin/data-objects/${dataObjectId}/versions/compare/${version1}/${version2}`);
      const data = (response as any).data || response;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to compare versions';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    dataObjects,
    currentDataObject,
    versions,
    loading,
    error,

    // Methods
    fetchDataObjects,
    fetchDataObject,
    createDataObject,
    updateDataObject,
    deleteDataObject,
    addField,
    updateField,
    deleteField,
    fetchVersionHistory,
    fetchVersion,
    compareVersions,
  };
}
