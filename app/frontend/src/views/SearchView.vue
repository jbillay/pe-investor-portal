<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Search Header -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Search</h1>

      <!-- Search Input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="pi pi-search text-gray-400"></i>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search for users, roles, data objects, or plugins..."
          @keyup.enter="performSearch"
        />
      </div>

      <!-- Search Button -->
      <div class="mt-4">
        <button
          @click="performSearch"
          :disabled="!searchQuery.trim()"
          class="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <i class="pi pi-search mr-2"></i>
          Search
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="hasSearched" class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">
          Search Results
          <span v-if="results.length > 0" class="text-gray-500 font-normal">
            ({{ results.length }} found)
          </span>
        </h2>
        <button
          v-if="results.length > 0"
          @click="clearSearch"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear
        </button>
      </div>

      <!-- No Results -->
      <div v-if="results.length === 0" class="text-center py-12">
        <i class="pi pi-search text-gray-300 text-5xl mb-4"></i>
        <p class="text-gray-500 text-lg">No results found for "{{ searchQuery }}"</p>
        <p class="text-gray-400 text-sm mt-2">Try different keywords or check your spelling</p>
      </div>

      <!-- Results List -->
      <div v-else class="space-y-3">
        <div
          v-for="result in results"
          :key="result.id"
          class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          @click="openResult(result)"
        >
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <i :class="result.icon" class="text-blue-600"></i>
          </div>
          <div class="ml-4 flex-1">
            <h3 class="text-sm font-semibold text-gray-900">{{ result.title }}</h3>
            <p class="text-sm text-gray-600">{{ result.description }}</p>
            <div class="flex items-center mt-1 text-xs text-gray-500">
              <span class="px-2 py-1 bg-gray-200 rounded">{{ result.category }}</span>
            </div>
          </div>
          <div class="flex-shrink-0">
            <i class="pi pi-chevron-right text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Notice -->
    <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div class="flex items-start">
        <i class="pi pi-info-circle text-blue-600 text-xl mr-3 mt-1"></i>
        <div>
          <h3 class="text-sm font-semibold text-blue-900">Search Feature</h3>
          <p class="text-sm text-blue-700 mt-1">
            Enter keywords above to search across users, roles, data objects, and plugins.
            Full-text search functionality is currently in development.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const searchQuery = ref('');
const hasSearched = ref(false);
const results = ref<any[]>([]);

const performSearch = () => {
  if (!searchQuery.value.trim()) return;

  hasSearched.value = true;

  // TODO: Implement real search functionality
  // For now, return empty results
  results.value = [];

  console.log('Searching for:', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  hasSearched.value = false;
  results.value = [];
};

const openResult = (result: any) => {
  // Navigate to result based on category
  console.log('Opening result:', result);
  // router.push(result.link);
};
</script>

<style scoped>
/* Custom styles if needed */
</style>
