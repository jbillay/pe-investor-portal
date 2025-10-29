<template>
  <div class="rich-text-preview text-gray-900">
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string | null;
}>();

const displayValue = computed(() => {
  if (!props.value) {
    return '-';
  }

  // Strip HTML tags and limit length
  const stripped = String(props.value).replace(/<[^>]*>/g, '');
  const maxLength = 100;

  if (stripped.length > maxLength) {
    return stripped.substring(0, maxLength) + '...';
  }

  return stripped;
});
</script>

<style scoped>
.rich-text-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
