<template>
  <span class="text-gray-900">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: any;
}>();

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return '-';
  }
  return String(props.value);
});
</script>
