import { ref } from 'vue';
import { useApi } from '../useApi';
import type {
  DynamicInstance,
  DynamicSchema,
  PaginatedInstances,
  CreateInstanceDto,
  UpdateInstanceDto,
  QueryParams
} from '@/types/dynamic-data';

export function useDataInstances() {
  const { api } = useApi();

  const instances = ref<DynamicInstance[]>([]);
  const currentInstance = ref<DynamicInstance | null>(null);
  const schema = ref<DynamicSchema | null>(null);
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================================================
  // SCHEMA
  // ============================================================================

  const fetchSchema = async (dataObjectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DynamicSchema>(`/data/${dataObjectId}/schema`);
      const data = (response as any).data || response;
      schema.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch schema';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ============================================================================
  // INSTANCE CRUD
  // ============================================================================

  const fetchInstances = async (dataObjectId: string, params?: QueryParams) => {
    loading.value = true;
    error.value = null;
    try {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      const response = await api.get<PaginatedInstances>(`/data/${dataObjectId}/instances${queryString}`);
      const data = (response as any).data || response;

      instances.value = data.items || [];
      if (data.pagination) {
        pagination.value = data.pagination;
      }
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch instances';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchInstance = async (dataObjectId: string, instanceId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<DynamicInstance>(`/data/${dataObjectId}/instances/${instanceId}`);
      const data = (response as any).data || response;
      currentInstance.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createInstance = async (dataObjectId: string, dto: CreateInstanceDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<DynamicInstance>(`/data/${dataObjectId}/instances`, dto);
      const data = (response as any).data || response;

      if (!instances.value) {
        instances.value = [];
      }
      instances.value.unshift(data);
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to create instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateInstance = async (dataObjectId: string, instanceId: string, dto: UpdateInstanceDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<DynamicInstance>(`/data/${dataObjectId}/instances/${instanceId}`, dto);
      const data = (response as any).data || response;

      const index = instances.value.findIndex(inst => inst.id === instanceId);
      if (index !== -1) {
        instances.value[index] = data;
      }
      if (currentInstance.value?.id === instanceId) {
        currentInstance.value = data;
      }
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to update instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteInstance = async (dataObjectId: string, instanceId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/data/${dataObjectId}/instances/${instanceId}`);
      instances.value = instances.value.filter(inst => inst.id !== instanceId);
      if (currentInstance.value?.id === instanceId) {
        currentInstance.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete instance';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    instances,
    currentInstance,
    schema,
    pagination,
    loading,
    error,

    // Methods
    fetchSchema,
    fetchInstances,
    fetchInstance,
    createInstance,
    updateInstance,
    deleteInstance,
  };
}
