<template>
  <div class="admin-dashboard">
    <!-- Enhanced Header -->
    <div class="admin-header">
      <div class="admin-header-content">
        <div class="admin-breadcrumb">
          <Breadcrumb :model="breadcrumbItems" class="admin-breadcrumb-nav" />
        </div>
        <div class="admin-title-section">
          <div class="admin-title-content">
            <div class="admin-icon">
              <i class="pi pi-puzzle text-blue-600"></i>
            </div>
            <div>
              <h1 class="admin-title">Plugin Management</h1>
              <p class="admin-subtitle">Upload, install, and manage application plugins to extend functionality</p>
            </div>
          </div>
          <div class="admin-actions">
            <Button
              label="Refresh Data"
              icon="pi pi-refresh"
              class="p-button-outlined p-button-secondary admin-action-btn"
              @click="refreshData"
              :loading="loading"
              severity="secondary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Admin Content -->
    <div class="admin-layout">
      <main class="admin-content content-expanded">
        <div class="content-container">
          <!-- Admin Navigation -->
          <AdminNavigation />

          <!-- Plugin Management Content -->
          <div class="content-section">
            <PluginManager ref="pluginManagerComponent" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';

// Custom Components
import AdminNavigation from '@/components/admin/AdminNavigation.vue';
import PluginManager from '@/components/admin/PluginManager.vue';

/**
 * Plugin Management View
 * Admin page for managing application plugins
 */

// Composables
const router = useRouter();
const toast = useToast();

// Component state
const loading = ref(false);
const pluginManagerComponent = ref(null);

// Breadcrumb
const breadcrumbItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Administration',
    icon: 'pi pi-shield',
    command: () => router.push('/admin')
  },
  {
    label: 'Plugins',
    icon: 'pi pi-box'
  }
]);

// Methods
const refreshData = async () => {
  loading.value = true;
  try {
    if (pluginManagerComponent.value?.refreshPlugins) {
      await pluginManagerComponent.value.refreshPlugins();
    }
    toast.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'Plugin data has been refreshed successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to refresh data:', error);
    toast.add({
      severity: 'error',
      summary: 'Refresh Failed',
      detail: 'Failed to refresh plugin data',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Initialize data if needed
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
}

.admin-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.admin-header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.admin-breadcrumb {
  margin-bottom: 1rem;
}

.admin-breadcrumb-nav {
  background: transparent;
  border: none;
  padding: 0;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list) {
  color: white;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list li) {
  color: rgba(255, 255, 255, 0.9);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a) {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover) {
  background: white;
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-breadcrumb-nav :deep(.p-breadcrumb-list a:hover .p-breadcrumb-item-icon) {
  color: #1e40af;
}

.admin-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.admin-title-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.admin-icon {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.admin-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.admin-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 0;
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.admin-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.admin-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.admin-layout {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-content {
  width: 100%;
}

.content-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.content-section {
  padding: 1rem 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-header-content {
    padding: 1rem;
  }

  .admin-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .admin-title-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .admin-title {
    font-size: 1.5rem;
  }

  .admin-actions {
    width: 100%;
  }

  .admin-action-btn {
    flex: 1;
  }

  .admin-layout {
    padding: 1rem;
  }

  .content-container {
    padding: 1rem;
  }
}
</style>
