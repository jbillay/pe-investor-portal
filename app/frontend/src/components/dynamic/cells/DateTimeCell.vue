<template>
  <span class="text-gray-900">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: any;
}>();

const displayValue = computed(() => {
  if (!props.value) {
    return '-';
  }
  return new Date(props.value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>
