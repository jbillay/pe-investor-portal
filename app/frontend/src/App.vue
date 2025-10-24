<script setup lang="ts">
import { onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

// Get toast instance and expose it globally for plugins
const toast = useToast();
const authStore = useAuthStore();

onMounted(() => {
  // Expose toast instance to window for plugin context
  (window as any).__toast = toast;
});
</script>

<template>
  <div id="app">
    <!-- Loading overlay when refreshing tokens -->
    <div
      v-if="authStore.isRefreshing"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center">
        <ProgressSpinner
          style="width: 50px; height: 50px"
          strokeWidth="4"
          animationDuration="1s"
        />
        <p class="mt-4 text-gray-700 font-medium">Refreshing session...</p>
      </div>
    </div>

    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<style scoped></style>
