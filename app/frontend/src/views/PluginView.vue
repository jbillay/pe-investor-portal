<template>
  <div class="plugin-container">
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <ProgressSpinner />
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-6xl text-error-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Plugin Error</h2>
        <p class="text-gray-600">{{ error }}</p>
        <router-link to="/" class="mt-4 inline-block text-primary-600 hover:text-primary-700">
          Return to Dashboard
        </router-link>
      </div>
    </div>

    <div v-else-if="!pluginComponent" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="pi pi-puzzle-piece text-6xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Plugin Not Found</h2>
        <p class="text-gray-600">The plugin "{{ pluginId }}" could not be loaded.</p>
        <router-link to="/" class="mt-4 inline-block text-primary-600 hover:text-primary-700">
          Return to Dashboard
        </router-link>
      </div>
    </div>

    <!-- Render plugin component dynamically -->
    <component v-else :is="pluginComponent" :plugin-id="pluginId" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePluginRegistryStore } from '@/stores/pluginRegistry'

const route = useRoute()
const pluginRegistryStore = usePluginRegistryStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const pluginId = ref<string>('')

const pluginComponent = computed(() => {
  if (!pluginId.value) return null

  const loadedPlugin = pluginRegistryStore.getLoadedPlugin(pluginId.value)

  if (!loadedPlugin) {
    return null
  }

  // Return the plugin's component (default export)
  return loadedPlugin.component || loadedPlugin.module?.default
})

onMounted(async () => {
  try {
    isLoading.value = true

    // Find plugin ID by route
    const foundPluginId = pluginRegistryStore.getPluginIdByRoute(route.path)

    if (!foundPluginId) {
      error.value = `No plugin found for route "${route.path}"`
      return
    }

    pluginId.value = foundPluginId

    // Check if plugin exists
    const plugin = pluginRegistryStore.getPluginById(pluginId.value)
    if (!plugin) {
      error.value = `Plugin "${pluginId.value}" not found`
      return
    }

    // Check if plugin is installed
    if (plugin.status !== 'INSTALLED') {
      error.value = `Plugin "${pluginId.value}" is not installed`
      return
    }

    // Check if plugin module is loaded
    if (!pluginRegistryStore.isPluginLoaded(pluginId.value)) {
      error.value = `Plugin "${pluginId.value}" module is not loaded`
      return
    }

    // Plugin is ready to render
    console.log(`Rendering plugin: ${pluginId.value}`)
  } catch (err: any) {
    console.error('Error loading plugin view:', err)
    error.value = err.message || 'Failed to load plugin'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.plugin-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
}
</style>
