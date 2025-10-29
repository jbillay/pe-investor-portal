<template>
  <div class="dynamic-form-view p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Button
            icon="pi pi-arrow-left"
            class="p-button-text"
            @click="handleCancel"
          />
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              {{ isEditMode ? 'Edit' : 'Create' }} {{ schema?.name || '' }}
            </h1>
            <p v-if="schema?.description" class="text-gray-600 mt-1">{{ schema.description }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !schema" class="flex justify-center items-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <Message v-if="error" severity="error" class="mb-4">
        {{ error }}
      </Message>

      <!-- Permission Error -->
      <Card v-if="schema && !canWrite" class="text-center py-12">
        <template #content>
          <i class="pi pi-lock text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Access Denied</h3>
          <p class="text-gray-500 mb-4">
            You don't have permission to {{ isEditMode ? 'edit' : 'create' }} {{ schema.name }} records
          </p>
          <Button
            label="Back to List"
            icon="pi pi-arrow-left"
            @click="handleCancel"
          />
        </template>
      </Card>

      <!-- Form -->
      <Card v-if="schema && canWrite">
        <template #content>
          <DynamicForm
            :schema="schema"
            :initial-values="initialValues"
            :submit-label="isEditMode ? 'Update' : 'Create'"
            :loading="submitLoading"
            @submit="handleSubmit"
            @cancel="handleCancel"
          />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDynamicData } from '@/composables/dynamic/useDynamicData';
import DynamicForm from '@/components/dynamic/DynamicForm.vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

const route = useRoute();
const router = useRouter();

const dataKey = computed(() => route.params.dataKey as string);
const instanceId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => !!instanceId.value);

const {
  schema,
  instance,
  loading,
  error,
  canWrite,
  fetchSchema,
  fetchInstance,
  createInstance,
  updateInstance,
} = useDynamicData(dataKey.value);

const submitLoading = ref(false);
const initialValues = ref<Record<string, any>>({});

onMounted(async () => {
  await fetchSchema();

  if (isEditMode.value && instanceId.value) {
    await fetchInstance(instanceId.value);
    if (instance.value) {
      initialValues.value = { ...instance.value.values };
    }
  }
});

const handleSubmit = async (values: Record<string, any>) => {
  submitLoading.value = true;

  try {
    if (isEditMode.value && instanceId.value) {
      await updateInstance(instanceId.value, { values });
    } else {
      await createInstance({ values });
    }

    // Navigate back to list on success
    router.push(`/dynamic/${dataKey.value}`);
  } catch (err) {
    console.error('Failed to save instance:', err);
  } finally {
    submitLoading.value = false;
  }
};

const handleCancel = () => {
  router.push(`/dynamic/${dataKey.value}`);
};
</script>
