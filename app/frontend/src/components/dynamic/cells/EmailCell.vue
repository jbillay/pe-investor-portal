<template>
  <a
    v-if="value"
    :href="`mailto:${value}`"
    class="text-blue-600 hover:text-blue-800 hover:underline"
  >
    {{ value }}
  </a>
  <span v-else class="text-gray-400">-</span>
</template>

<script setup lang="ts">
defineProps<{
  value: string | null;
}>();
</script>
