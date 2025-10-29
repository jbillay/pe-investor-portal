<template>
  <a
    v-if="props.value"
    :href="props.value"
    target="_blank"
    rel="noopener noreferrer"
    class="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
  >
    {{ displayText }}
    <i class="pi pi-external-link text-xs"></i>
  </a>
  <span v-else class="text-gray-400">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string | null;
}>();

const displayText = computed(() => {
  if (!props.value) return '';

  try {
    const url = new URL(props.value);
    return url.hostname;
  } catch {
    return props.value;
  }
});
</script>
