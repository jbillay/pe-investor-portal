<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Documents</h1>
          <p class="mt-1 text-gray-600">
            Access your investment documents, reports, and statements
          </p>
        </div>
        <button
          @click="uploadDocument"
          class="flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <i class="pi pi-upload mr-2"></i>
          Upload Document
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="pi pi-search text-gray-400"></i>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search documents..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-4">
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            <option value="financial">Financial Reports</option>
            <option value="legal">Legal Documents</option>
            <option value="operational">Operational Reports</option>
            <option value="compliance">Compliance</option>
          </select>

          <select
            v-model="selectedType"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="powerpoint">PowerPoint</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Documents List -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <!-- List Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Recent Documents
            <span class="text-sm font-normal text-gray-500">
              ({{ filteredDocuments.length }} documents)
            </span>
          </h2>

          <div class="flex items-center space-x-2">
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded focus:outline-none',
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              ]"
            >
              <i class="pi pi-list"></i>
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded focus:outline-none',
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-400 hover:text-gray-600'
              ]"
            >
              <i class="pi pi-th-large"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="divide-y divide-gray-200">
        <div
          v-for="document in paginatedDocuments"
          :key="document.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center space-x-4">
            <!-- File Icon -->
            <div :class="['flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', document.iconBg]">
              <i :class="[document.icon, document.iconColor, 'text-lg']"></i>
            </div>

            <!-- Document Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-sm font-semibold text-gray-900">
                      {{ document.title }}
                    </h3>
                    <span
                      v-if="document.isConfidential"
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded-full',
                        document.confidentialityLevel === 'HIGHLY_CONFIDENTIAL' ? 'bg-red-100 text-red-700' :
                        document.confidentialityLevel === 'CONFIDENTIAL' ? 'bg-orange-100 text-orange-700' :
                        document.confidentialityLevel === 'RESTRICTED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      ]"
                    >
                      {{ document.confidentialityLevel }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">
                    {{ document.description }}
                  </p>
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span class="flex items-center">
                      <i class="pi pi-calendar mr-1"></i>
                      {{ formatDate(document.uploadedAt) }}
                    </span>
                    <span class="flex items-center">
                      <i class="pi pi-file mr-1"></i>
                      {{ document.size }}
                    </span>
                    <span class="flex items-center">
                      <i class="pi pi-user mr-1"></i>
                      {{ document.uploadedBy }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    v-if="document.canView"
                    @click="viewDocument(document)"
                    class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="View"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  <button
                    v-if="document.canDownload"
                    @click="downloadDocument(document)"
                    class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Download"
                  >
                    <i class="pi pi-download"></i>
                  </button>
                  <button
                    v-if="document.canShare"
                    @click="shareDocument(document)"
                    class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Share"
                  >
                    <i class="pi pi-share-alt"></i>
                  </button>
                  <div
                    v-if="!document.canView && !document.canDownload && !document.canShare"
                    class="flex items-center text-gray-400"
                    title="Access Restricted"
                  >
                    <i class="pi pi-lock"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid View -->
      <div v-else class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="document in paginatedDocuments"
            :key="document.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-medium transition-shadow cursor-pointer"
            @click="viewDocument(document)"
          >
            <!-- File Icon -->
            <div :class="['w-12 h-12 rounded-lg flex items-center justify-center mb-3', document.iconBg]">
              <i :class="[document.icon, document.iconColor, 'text-xl']"></i>
            </div>

            <!-- Document Info -->
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                {{ document.title }}
              </h3>
              <span
                v-if="document.isConfidential"
                :class="[
                  'px-1 py-0.5 text-xs font-medium rounded ml-2 flex-shrink-0',
                  document.confidentialityLevel === 'HIGHLY_CONFIDENTIAL' ? 'bg-red-100 text-red-700' :
                  document.confidentialityLevel === 'CONFIDENTIAL' ? 'bg-orange-100 text-orange-700' :
                  document.confidentialityLevel === 'RESTRICTED' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                ]"
              >
                {{ document.confidentialityLevel.split('_')[0] }}
              </span>
            </div>
            <p class="text-xs text-gray-600 mb-3 line-clamp-2">
              {{ document.description }}
            </p>

            <!-- Meta Info -->
            <div class="space-y-1 text-xs text-gray-500">
              <div class="flex items-center">
                <i class="pi pi-calendar mr-1"></i>
                {{ formatDate(document.uploadedAt) }}
              </div>
              <div class="flex items-center">
                <i class="pi pi-file mr-1"></i>
                {{ document.size }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end space-x-1 mt-3 pt-3 border-t border-gray-100">
              <button
                v-if="document.canDownload"
                @click.stop="downloadDocument(document)"
                class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Download"
              >
                <i class="pi pi-download"></i>
              </button>
              <button
                v-if="document.canShare"
                @click.stop="shareDocument(document)"
                class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Share"
              >
                <i class="pi pi-share-alt"></i>
              </button>
              <div
                v-if="!document.canDownload && !document.canShare"
                class="flex items-center text-gray-400"
                title="Access Restricted"
              >
                <i class="pi pi-lock text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredDocuments.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <i class="pi pi-file-pdf text-gray-400 text-2xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p class="text-gray-600 mb-4">
          {{ searchQuery || selectedCategory || selectedType
            ? 'Try adjusting your search criteria.'
            : 'Upload your first document to get started.'
          }}
        </p>
        <button
          @click="uploadDocument"
          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <i class="pi pi-upload mr-2"></i>
          Upload Document
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="filteredDocuments.length > documentsPerPage" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * documentsPerPage + 1 }} to
            {{ Math.min(currentPage * documentsPerPage, filteredDocuments.length) }} of
            {{ filteredDocuments.length }} documents
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
import { ref, computed, onMounted, inject } from 'vue'
import type { Document } from '@/types/investment'

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedType = ref('')
const viewMode = ref<'list' | 'grid'>('list')
const currentPage = ref(1)
const documentsPerPage = ref(10)

// Enhanced document interface with security features
interface EnhancedDocument extends Document {
  category: string
  type: string
  size: string
  icon: string
  iconColor: string
  iconBg: string
  confidentialityLevel: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL'
  canView: boolean
  canDownload: boolean
  canShare: boolean
}

const addNotification = inject('addNotification') as Function

// Mock enhanced documents data with security metadata
const documents = ref<EnhancedDocument[]>([
  {
    id: '1',
    fundId: 'fund-1',
    title: 'Q3 2024 Financial Report.pdf',
    description: 'Quarterly financial performance report for all portfolio companies',
    category: 'financial',
    type: 'pdf',
    size: '2.4 MB',
    uploadedAt: '2024-10-15T10:30:00Z',
    uploadedBy: 'John Smith',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    documentType: 'QUARTERLY_REPORT',
    fileName: 'Q3_2024_Financial_Report.pdf',
    filePath: '/documents/quarterly-reports/q3-2024.pdf',
    fileSize: 2457600,
    mimeType: 'application/pdf',
    version: '1.0',
    isConfidential: true,
    accessLevel: 'INVESTOR',
    confidentialityLevel: 'CONFIDENTIAL',
    canView: true,
    canDownload: true,
    canShare: false,
    createdAt: '2024-10-15T10:30:00Z',
    updatedAt: '2024-10-15T10:30:00Z'
  },
  {
    id: '2',
    fundId: 'fund-2',
    title: 'Investment Agreement - Healthcare Fund.docx',
    description: 'Legal investment agreement documentation',
    category: 'legal',
    type: 'word',
    size: '1.8 MB',
    uploadedAt: '2024-10-12T14:20:00Z',
    uploadedBy: 'Sarah Johnson',
    icon: 'pi pi-file-word',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    documentType: 'LEGAL_AGREEMENT',
    fileName: 'Healthcare_Fund_Investment_Agreement.docx',
    filePath: '/documents/legal/healthcare-agreement.docx',
    fileSize: 1887437,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    version: '2.1',
    isConfidential: true,
    accessLevel: 'INVESTOR',
    confidentialityLevel: 'HIGHLY_CONFIDENTIAL',
    canView: true,
    canDownload: false,
    canShare: false,
    createdAt: '2024-10-12T14:20:00Z',
    updatedAt: '2024-10-12T14:20:00Z'
  },
  {
    id: '3',
    fundId: 'fund-1',
    title: 'Portfolio Analysis Q3.xlsx',
    description: 'Detailed portfolio performance analysis and metrics',
    category: 'financial',
    type: 'excel',
    size: '3.2 MB',
    uploadedAt: '2024-10-10T09:15:00Z',
    uploadedBy: 'Michael Chen',
    icon: 'pi pi-file-excel',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    documentType: 'FINANCIAL_STATEMENT',
    fileName: 'Portfolio_Analysis_Q3_2024.xlsx',
    filePath: '/documents/analysis/q3-portfolio.xlsx',
    fileSize: 3355443,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    version: '1.0',
    isConfidential: false,
    accessLevel: 'INVESTOR',
    confidentialityLevel: 'RESTRICTED',
    canView: true,
    canDownload: true,
    canShare: true,
    createdAt: '2024-10-10T09:15:00Z',
    updatedAt: '2024-10-10T09:15:00Z'
  },
  {
    id: '4',
    fundId: 'fund-1',
    title: 'Compliance Report 2024.pdf',
    description: 'Annual compliance and regulatory reporting',
    category: 'compliance',
    type: 'pdf',
    size: '1.1 MB',
    uploadedAt: '2024-10-08T16:45:00Z',
    uploadedBy: 'Emily Davis',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    documentType: 'ANNUAL_REPORT',
    fileName: 'Compliance_Report_2024.pdf',
    filePath: '/documents/compliance/annual-2024.pdf',
    fileSize: 1153433,
    mimeType: 'application/pdf',
    version: '1.0',
    isConfidential: false,
    accessLevel: 'PUBLIC',
    confidentialityLevel: 'PUBLIC',
    canView: true,
    canDownload: true,
    canShare: true,
    createdAt: '2024-10-08T16:45:00Z',
    updatedAt: '2024-10-08T16:45:00Z'
  },
  {
    id: '5',
    fundId: 'fund-2',
    title: 'Investment Strategy Presentation.pptx',
    description: 'Strategic overview and investment approach presentation',
    category: 'operational',
    type: 'powerpoint',
    size: '5.6 MB',
    uploadedAt: '2024-10-05T11:30:00Z',
    uploadedBy: 'David Wilson',
    icon: 'pi pi-file',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    documentType: 'QUARTERLY_REPORT',
    fileName: 'Investment_Strategy_Presentation.pptx',
    filePath: '/documents/strategy/investment-strategy.pptx',
    fileSize: 5872640,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    version: '1.3',
    isConfidential: true,
    accessLevel: 'INVESTOR',
    confidentialityLevel: 'CONFIDENTIAL',
    canView: true,
    canDownload: true,
    canShare: false,
    createdAt: '2024-10-05T11:30:00Z',
    updatedAt: '2024-10-05T11:30:00Z'
  }
])

const filteredDocuments = computed(() => {
  return documents.value.filter(doc => {
    const matchesSearch = !searchQuery.value ||
      doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = !selectedCategory.value || doc.category === selectedCategory.value
    const matchesType = !selectedType.value || doc.type === selectedType.value

    return matchesSearch && matchesCategory && matchesType
  })
})

const totalPages = computed(() => Math.ceil(filteredDocuments.value.length / documentsPerPage.value))

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * documentsPerPage.value
  const end = start + documentsPerPage.value
  return filteredDocuments.value.slice(start, end)
})

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}

const uploadDocument = () => {
  addNotification({
    type: 'info',
    title: 'Upload Document',
    message: 'Document upload functionality will be available soon.'
  })
}

const viewDocument = (document: EnhancedDocument) => {
  if (!document.canView) {
    addNotification({
      type: 'warning',
      title: 'Access Denied',
      message: 'You do not have permission to view this document.'
    })
    return
  }

  // Log access for audit trail
  console.log('Document accessed:', {
    documentId: document.id,
    title: document.title,
    confidentialityLevel: document.confidentialityLevel,
    timestamp: new Date().toISOString()
  })

  addNotification({
    type: 'info',
    title: 'Opening Document',
    message: `Opening ${document.title} in secure viewer...`
  })
}

const downloadDocument = (document: EnhancedDocument) => {
  if (!document.canDownload) {
    addNotification({
      type: 'error',
      title: 'Download Restricted',
      message: 'You do not have permission to download this document.'
    })
    return
  }

  if (document.isConfidential) {
    addNotification({
      type: 'warning',
      title: 'Confidential Document',
      message: `This is a ${document.confidentialityLevel} document. Handle with care.`
    })
  }

  // Log download for audit trail
  console.log('Document downloaded:', {
    documentId: document.id,
    title: document.title,
    fileSize: document.fileSize,
    timestamp: new Date().toISOString()
  })

  addNotification({
    type: 'success',
    title: 'Download Started',
    message: `${document.title} download initiated.`
  })
}

const shareDocument = (document: EnhancedDocument) => {
  if (!document.canShare) {
    addNotification({
      type: 'error',
      title: 'Sharing Restricted',
      message: 'This document cannot be shared due to security policies.'
    })
    return
  }

  addNotification({
    type: 'info',
    title: 'Share Document',
    message: 'Secure sharing options will be available soon.'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>