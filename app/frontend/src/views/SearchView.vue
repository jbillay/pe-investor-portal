<template>
  <div class="space-y-6">
    <!-- Search Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Search</h1>

      <!-- Search Form -->
      <div class="space-y-4">
        <!-- Main Search Input -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="pi pi-search text-gray-400"></i>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search documents, companies, reports..."
            class="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            @keyup.enter="performSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <i class="pi pi-times text-gray-400 hover:text-gray-600"></i>
          </button>
        </div>

        <!-- Search Filters -->
        <div class="flex flex-wrap gap-4">
          <!-- Type Filter -->
          <div class="min-w-0 flex-1 sm:flex-none sm:w-48">
            <select
              v-model="filters.type"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="document">Documents</option>
              <option value="report">Reports</option>
              <option value="company">Companies</option>
              <option value="fund">Funds</option>
            </select>
          </div>

          <!-- Category Filter -->
          <div class="min-w-0 flex-1 sm:flex-none sm:w-48">
            <select
              v-model="filters.category"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="financial">Financial</option>
              <option value="legal">Legal</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="min-w-0 flex-1 sm:flex-none sm:w-48">
            <select
              v-model="filters.dateRange"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Any Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="year">Past Year</option>
            </select>
          </div>

          <!-- Search Button -->
          <button
            @click="performSearch"
            :disabled="isLoading"
            class="flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
          >
            <i v-if="!isLoading" class="pi pi-search mr-2"></i>
            <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ isLoading ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="hasSearched" class="bg-white rounded-lg shadow-soft border border-gray-200">
      <!-- Results Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Search Results
            <span v-if="results.length > 0" class="text-sm font-normal text-gray-500">
              ({{ results.length }} {{ results.length === 1 ? 'result' : 'results' }})
            </span>
          </h2>

          <!-- Sort Options -->
          <div v-if="results.length > 0" class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Sort by:</span>
            <select
              v-model="sortBy"
              @change="sortResults"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Results List -->
      <div class="divide-y divide-gray-200">
        <!-- No Results -->
        <div v-if="results.length === 0" class="p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="pi pi-search text-gray-400 text-2xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p class="text-gray-600">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>

        <!-- Results Items -->
        <div
          v-for="result in paginatedResults"
          :key="result.id"
          class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="openResult(result)"
        >
          <div class="flex items-start space-x-4">
            <!-- Icon -->
            <div :class="['flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', result.iconBg]">
              <i :class="[result.icon, result.iconColor, 'text-lg']"></i>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-sm font-semibold text-gray-900 mb-1">
                    {{ result.title }}
                  </h3>
                  <p class="text-sm text-gray-600 mb-2">
                    {{ result.description }}
                  </p>
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span class="flex items-center">
                      <i class="pi pi-tag mr-1"></i>
                      {{ result.type }}
                    </span>
                    <span class="flex items-center">
                      <i class="pi pi-calendar mr-1"></i>
                      {{ formatDate(result.date) }}
                    </span>
                    <span v-if="result.size" class="flex items-center">
                      <i class="pi pi-file mr-1"></i>
                      {{ result.size }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    @click.stop="downloadResult(result)"
                    v-if="result.downloadable"
                    class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Download"
                  >
                    <i class="pi pi-download"></i>
                  </button>
                  <button
                    @click.stop="shareResult(result)"
                    class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Share"
                  >
                    <i class="pi pi-share-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="results.length > resultsPerPage" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * resultsPerPage + 1 }} to
            {{ Math.min(currentPage * resultsPerPage, results.length) }} of
            {{ results.length }} results
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span class="px-3 py-1 text-sm bg-primary-600 text-white rounded">
              {{ currentPage }}
            </span>

            <button
              @click="currentPage++"
              :disabled="currentPage >= totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const isLoading = ref(false)
const hasSearched = ref(false)
const results = ref<any[]>([])
const currentPage = ref(1)
const resultsPerPage = ref(10)
const sortBy = ref('relevance')

const filters = ref({
  type: '',
  category: '',
  dateRange: ''
})

// Mock search results - in a real app, this would come from an API
const mockResults = [
  {
    id: 1,
    title: 'Q3 2024 Financial Report - Tech Growth Fund',
    description: 'Quarterly financial performance and portfolio analysis for the Tech Growth Fund.',
    type: 'Financial Report',
    category: 'financial',
    date: '2024-10-15',
    size: '2.4 MB',
    downloadable: true,
    icon: 'pi pi-chart-line',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100'
  },
  {
    id: 2,
    title: 'Investment Agreement - Healthcare Innovation Fund',
    description: 'Legal documentation for the Healthcare Innovation Fund investment terms.',
    type: 'Legal Document',
    category: 'legal',
    date: '2024-09-28',
    size: '1.8 MB',
    downloadable: true,
    icon: 'pi pi-file-pdf',
    iconColor: 'text-error-600',
    iconBg: 'bg-error-100'
  },
  {
    id: 3,
    title: 'Portfolio Company Analysis - TechCorp Inc.',
    description: 'Detailed analysis and performance metrics for TechCorp Inc. portfolio company.',
    type: 'Company Report',
    category: 'operational',
    date: '2024-10-01',
    size: '3.1 MB',
    downloadable: true,
    icon: 'pi pi-building',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    id: 4,
    title: 'Compliance Report - Q3 2024',
    description: 'Quarterly compliance and regulatory reporting for all fund activities.',
    type: 'Compliance Report',
    category: 'compliance',
    date: '2024-10-10',
    size: '1.2 MB',
    downloadable: true,
    icon: 'pi pi-shield',
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100'
  }
]

const totalPages = computed(() => Math.ceil(results.value.length / resultsPerPage.value))

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * resultsPerPage.value
  const end = start + resultsPerPage.value
  return results.value.slice(start, end)
})

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  try {
    isLoading.value = true
    hasSearched.value = true
    currentPage.value = 1

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    // Filter mock results based on search criteria
    results.value = mockResults.filter(item => {
      const matchesQuery = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.value.toLowerCase())

      const matchesType = !filters.value.type || item.type.toLowerCase().includes(filters.value.type.toLowerCase())
      const matchesCategory = !filters.value.category || item.category === filters.value.category

      return matchesQuery && matchesType && matchesCategory
    })

    sortResults()

  } catch (error) {
    console.error('Search failed:', error)
    results.value = []
  } finally {
    isLoading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  results.value = []
  hasSearched.value = false
  filters.value = {
    type: '',
    category: '',
    dateRange: ''
  }
}

const sortResults = () => {
  switch (sortBy.value) {
    case 'date':
      results.value.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      break
    case 'name':
      results.value.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'relevance':
    default:
      // Keep original relevance order
      break
  }
}

const openResult = (result: any) => {
  // In a real app, this would open the document or navigate to a detail view
  console.log('Opening result:', result)
}

const downloadResult = (result: any) => {
  // In a real app, this would trigger a download
  console.log('Downloading result:', result)
}

const shareResult = (result: any) => {
  // In a real app, this would open a share dialog
  console.log('Sharing result:', result)
}

// Initialize search from URL query
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q as string
    performSearch()
  }
})

// Watch for filter changes to auto-search
watch([filters], () => {
  if (hasSearched.value && searchQuery.value.trim()) {
    performSearch()
  }
}, { deep: true })
</script>