import { ref, computed } from 'vue';
import { useApi } from '../useApi';
import type {
  DynamicSchema,
  DynamicInstance,
  PaginatedInstances,
  CreateInstanceDto,
  UpdateInstanceDto,
  QueryParams,
  ChangeLogEntry
} from '@/types/dynamic-data';

export function useDynamicData(dataKey: string) {
  const { api } = useApi();

  const schema = ref<DynamicSchema | null>(null);
  const instances = ref<DynamicInstance[]>([]);
  const instance = ref<DynamicInstance | null>(null);
  const changeHistory = ref<ChangeLogEntry[]>([]);
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const loading = ref(false);
  const instancesLoading = ref(false);
  const error = ref<string | null>(null);
  const instancesError = ref<string | null>(null);

  const canRead = computed(() => schema.value?.permissions?.canRead ?? false);
  const canWrite = computed(() => schema.value?.permissions?.canWrite ?? false);
  const canDelete = computed(() => schema.value?.permissions?.canDelete ?? false);

  // ============================================================================
  // SCHEMA
  // ============================================================================

  const fetchSchema = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DynamicSchema>(`/dynamic/${dataKey}/schema`);
      schema.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch schema';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ============================================================================
  // INSTANCES CRUD
  // ============================================================================

  const fetchInstances = async (params?: QueryParams) => {
    instancesLoading.value = true;
    instancesError.value = null;
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
      if (params?.search) queryParams.set('search', params.search);

      const url = `/dynamic/${dataKey}?${queryParams.toString()}`;
      const response = await api.get<PaginatedInstances>(url);

      instances.value = response.data.items;
      pagination.value = response.data.pagination;
      return response.data;
    } catch (err: any) {
      instancesError.value = err.message || 'Failed to fetch instances';
      throw err;
    } finally {
      instancesLoading.value = false;
    }
  };

  const fetchInstance = async (instanceId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DynamicInstance>(`/dynamic/${dataKey}/${instanceId}`);
      instance.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createInstance = async (dto: CreateInstanceDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<DynamicInstance>(`/dynamic/${dataKey}`, dto);
      instances.value.unshift(response.data);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateInstance = async (instanceId: string, dto: UpdateInstanceDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<DynamicInstance>(`/dynamic/${dataKey}/${instanceId}`, dto);
      const index = instances.value.findIndex(inst => inst.id === instanceId);
      if (index !== -1) {
        instances.value[index] = response.data;
      }
      if (instance.value?.id === instanceId) {
        instance.value = response.data;
      }
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/dynamic/${dataKey}/${instanceId}`);
      instances.value = instances.value.filter(inst => inst.id !== instanceId);
      if (instance.value?.id === instanceId) {
        instance.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================

  const searchInstances = async (filters: any[], params?: QueryParams) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<PaginatedInstances>(`/dynamic/${dataKey}/search`, {
        filters,
        ...params
      });
      instances.value = response.data.items;
      pagination.value = response.data.pagination;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to search instances';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const exportToCSV = async (params?: QueryParams) => {
    loading.value = true;
    error.value = null;
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);

      const url = `/dynamic/${dataKey}/export/csv?${queryParams.toString()}`;
      // This would trigger a file download
      window.location.href = url;
    } catch (err: any) {
      error.value = err.message || 'Failed to export to CSV';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const exportToJSON = async (params?: QueryParams) => {
    loading.value = true;
    error.value = null;
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);

      const url = `/dynamic/${dataKey}/export/json?${queryParams.toString()}`;
      const response = await api.get<any[]>(url);
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to export to JSON';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchChangeHistory = async (instanceId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<ChangeLogEntry[]>(`/dynamic/${dataKey}/${instanceId}/history`);
      changeHistory.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch history';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const exportCSV = async (params?: QueryParams) => {
    return exportToCSV(params);
  };

  return {
    // State
    schema,
    instances,
    instance,
    changeHistory,
    pagination,
    loading,
    instancesLoading,
    error,
    instancesError,

    // Computed
    canRead,
    canWrite,
    canDelete,

    // Methods
    fetchSchema,
    fetchInstances,
    fetchInstance,
    createInstance,
    updateInstance,
    deleteInstance,
    searchInstances,
    exportToCSV,
    exportToJSON,
    exportCSV,
    fetchChangeHistory,
  };
}
