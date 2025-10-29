<template>
  <span class="text-gray-900 font-mono">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: any;
}>();

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US').format(Number(props.value));
});
</script>
