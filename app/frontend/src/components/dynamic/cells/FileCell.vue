<template>
  <div v-if="props.value" class="inline-flex items-center gap-2">
    <i class="pi pi-file text-gray-500"></i>
    <span class="text-sm text-gray-700">{{ fileName }}</span>
  </div>
  <span v-else class="text-gray-400">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: any;
}>();

const fileName = computed(() => {
  if (!props.value) return '';
  return props.value.name || props.value.fileName || 'File';
});
</script>
