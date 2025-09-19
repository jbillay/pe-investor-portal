<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<template>
  <div id="app">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<style scoped></style>
