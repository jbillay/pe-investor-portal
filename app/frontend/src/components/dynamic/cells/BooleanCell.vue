<template>
  <Tag
    :value="displayValue"
    :severity="props.value ? 'success' : 'secondary'"
    :icon="props.value ? 'pi pi-check' : 'pi pi-times'"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Tag from 'primevue/tag';

const props = defineProps<{
  value: any;
}>();

const displayValue = computed(() => {
  return props.value ? 'Yes' : 'No';
});
</script>
