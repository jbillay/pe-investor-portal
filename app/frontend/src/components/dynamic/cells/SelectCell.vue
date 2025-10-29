<template>
  <div class="flex flex-wrap gap-1">
    <Tag
      v-for="(item, index) in displayItems"
      :key="index"
      :value="item"
      severity="info"
    />
    <span v-if="!displayItems.length" class="text-gray-400">-</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

const props = defineProps<{
  value: any;
}>();

const displayItems = computed(() => {
  if (!props.value) {
    return [];
  }
  if (Array.isArray(props.value)) {
    return props.value.filter(Boolean);
  }
  return [props.value];
});
</script>
