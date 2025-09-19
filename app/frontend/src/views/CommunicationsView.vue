<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Communications</h1>
          <p class="mt-1 text-gray-600">
            Stay updated with announcements, alerts, and important notifications
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="refreshCommunications"
            class="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          >
            <i :class="['pi pi-refresh mr-2', isLoading ? 'animate-spin' : '']"></i>
            Refresh
          </button>
          <button
            @click="markAllAsRead"
            v-if="unreadCount > 0"
            class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <i class="pi pi-check mr-2"></i>
            Mark All Read ({{ unreadCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center space-x-2">
              <i :class="tab.icon"></i>
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.count > 0"
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  activeTab === tab.value
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ tab.count }}
              </span>
            </div>
          </button>
        </nav>
      </div>

      <!-- Communications List -->
      <div class="p-6">
        <div v-if="filteredCommunications.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="pi pi-inbox text-gray-400 text-2xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No communications</h3>
          <p class="text-gray-600">
            {{ activeTab === 'unread' ? 'All caught up! No unread messages.' : 'No communications in this category.' }}
          </p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="communication in paginatedCommunications"
            :key="communication.id"
            :class="[
              'p-6 border rounded-lg hover:shadow-medium transition-shadow cursor-pointer',
              !communication.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
            ]"
            @click="openCommunication(communication)"
          >
            <div class="flex items-start space-x-4">
              <!-- Type Icon -->
              <div
                :class="[
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  getCommunicationIconStyle(communication.type, communication.priority)
                ]"
              >
                <i :class="[getCommunicationIcon(communication.type), 'text-lg']"></i>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3 mb-2">
                      <h3 :class="['text-lg font-semibold', !communication.isRead ? 'text-gray-900' : 'text-gray-700']">
                        {{ communication.title }}
                      </h3>
                      <span
                        v-if="communication.priority === 'URGENT'"
                        class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                      >
                        URGENT
                      </span>
                      <span
                        v-else-if="communication.priority === 'HIGH'"
                        class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                      >
                        HIGH PRIORITY
                      </span>
                    </div>

                    <p :class="['text-sm mb-3 line-clamp-2', !communication.isRead ? 'text-gray-700' : 'text-gray-600']">
                      {{ communication.content }}
                    </p>

                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                      <span class="flex items-center">
                        <i class="pi pi-clock mr-1"></i>
                        {{ formatDate(communication.publishedAt || communication.createdAt) }}
                      </span>
                      <span class="flex items-center">
                        <i class="pi pi-user mr-1"></i>
                        {{ communication.publishedBy }}
                      </span>
                      <span v-if="communication.fundId" class="flex items-center">
                        <i class="pi pi-building mr-1"></i>
                        Fund Communication
                      </span>
                      <span v-else class="flex items-center">
                        <i class="pi pi-globe mr-1"></i>
                        Global Communication
                      </span>
                      <span class="flex items-center">
                        <i class="pi pi-tag mr-1"></i>
                        {{ communication.type }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions & Status -->
                  <div class="flex items-center space-x-3 ml-4">
                    <div v-if="!communication.isRead" class="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <button
                      @click.stop="toggleReadStatus(communication)"
                      class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      :title="communication.isRead ? 'Mark as unread' : 'Mark as read'"
                    >
                      <i :class="communication.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open'"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to
            {{ Math.min(currentPage * itemsPerPage, filteredCommunications.length) }} of
            {{ filteredCommunications.length }} communications
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <span class="px-3 py-1 text-sm bg-blue-600 text-white rounded">
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

  <!-- Communication Detail Modal -->
  <div
    v-if="selectedCommunication"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click="closeCommunication"
  >
    <div
      class="bg-white rounded-lg shadow-strong max-w-2xl w-full max-h-96 overflow-hidden"
      @click.stop
    >
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                getCommunicationIconStyle(selectedCommunication.type, selectedCommunication.priority)
              ]"
            >
              <i :class="[getCommunicationIcon(selectedCommunication.type), 'text-lg']"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedCommunication.title }}</h3>
              <div class="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                <span>{{ formatDate(selectedCommunication.publishedAt || selectedCommunication.createdAt) }}</span>
                <span>•</span>
                <span>{{ selectedCommunication.publishedBy }}</span>
              </div>
            </div>
          </div>
          <button
            @click="closeCommunication"
            class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <div class="p-6 overflow-y-auto max-h-80">
        <div class="prose prose-sm max-w-none">
          <p class="text-gray-700 whitespace-pre-wrap">{{ selectedCommunication.content }}</p>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <span class="flex items-center">
              <i class="pi pi-tag mr-1"></i>
              {{ selectedCommunication.type }}
            </span>
            <span v-if="selectedCommunication.fundId" class="flex items-center">
              <i class="pi pi-building mr-1"></i>
              Fund Communication
            </span>
          </div>
          <button
            @click="toggleReadStatus(selectedCommunication)"
            class="flex items-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            <i :class="[selectedCommunication.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open', 'mr-2']"></i>
            {{ selectedCommunication.isRead ? 'Mark as unread' : 'Mark as read' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Communication } from '@/types/investment'

const addNotification = inject('addNotification') as Function

const isLoading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectedCommunication = ref<(Communication & { isRead: boolean }) | null>(null)

// Mock communications data
const communications = ref<(Communication & { isRead: boolean })[]>([
  {
    id: '1',
    fundId: 'fund-1',
    title: 'Capital Call Notice - Healthcare Fund II',
    content: `Dear Investors,

We are issuing a capital call for Healthcare Fund II in the amount of $2,500,000. This call is being made to fund the acquisition of MedTech Solutions, a promising healthcare technology company that aligns perfectly with our investment strategy.

Key Details:
• Total Amount: $2,500,000
• Your Allocation: Based on your commitment percentage
• Due Date: November 15, 2024
• Settlement Instructions: Will be sent separately via secure email

Please ensure payment is received by the due date to avoid any late fees. If you have any questions about this capital call, please contact our investor relations team immediately.

Thank you for your continued partnership.

Best regards,
Healthcare Fund II Management Team`,
    type: 'ALERT',
    priority: 'HIGH',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED',
    publishedBy: 'Fund Administrator',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Quarterly Investor Portal Maintenance',
    content: `The investor portal will undergo scheduled maintenance to improve performance and add new features.

Maintenance Window:
• Date: Sunday, October 22nd, 2024
• Time: 2:00 AM - 6:00 AM EST
• Expected Downtime: 4 hours

During this period, you will not be able to access the portal. All services will be fully restored by 6:00 AM EST.

We apologize for any inconvenience and appreciate your patience as we work to enhance your experience.`,
    type: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    isGlobal: true,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED',
    publishedBy: 'System Administrator',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    fundId: 'fund-2',
    title: 'Q3 Distribution Payment Processed',
    content: `We are pleased to inform you that your Q3 distribution payment has been processed successfully.

Distribution Details:
• Fund: Technology Growth Fund I
• Distribution Amount: $125,000
• Distribution Type: Return of Capital + Capital Gains
• Tax Withholding: $0
• Net Amount: $125,000

The payment will be credited to your designated bank account within 2-3 business days. You will receive a detailed distribution statement via email within 24 hours.

Thank you for your investment in Technology Growth Fund I.`,
    type: 'NOTIFICATION',
    priority: 'NORMAL',
    targetAudience: 'SPECIFIC',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED',
    publishedBy: 'Finance Team',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'New Document Available: Q3 Financial Report',
    content: `The Q3 2024 financial report for all funds is now available in your document library.

This comprehensive report includes:
• Portfolio performance summary
• Individual investment updates
• Market analysis and outlook
• Financial statements and metrics

Please log in to your account and navigate to the Documents section to review the report. We encourage you to read through the entire document and contact us with any questions.

The report contains confidential information and should not be shared with unauthorized parties.`,
    type: 'NOTIFICATION',
    priority: 'NORMAL',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED',
    publishedBy: 'Investment Team',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    fundId: 'fund-1',
    title: 'Portfolio Company Exit - TechStart Inc.',
    content: `We are excited to announce the successful exit of TechStart Inc. from Healthcare Fund II.

Exit Summary:
• Company: TechStart Inc. (Healthcare Technology)
• Investment Date: January 2021
• Exit Date: October 2024
• Total Return Multiple: 3.2x
• IRR: 45.8%
• Exit Method: Strategic Acquisition

This exit represents one of our most successful investments to date and demonstrates the strength of our investment strategy in the healthcare technology sector. The proceeds will be distributed to investors in the coming weeks.

We thank you for your confidence in our investment approach and look forward to sharing more successes in the future.`,
    type: 'ANNOUNCEMENT',
    priority: 'HIGH',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PUBLISHED',
    publishedBy: 'Investment Team',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
])

const tabs = computed(() => [
  {
    value: 'all',
    label: 'All',
    icon: 'pi pi-inbox',
    count: communications.value.length
  },
  {
    value: 'unread',
    label: 'Unread',
    icon: 'pi pi-envelope',
    count: communications.value.filter(c => !c.isRead).length
  },
  {
    value: 'alerts',
    label: 'Alerts',
    icon: 'pi pi-exclamation-triangle',
    count: communications.value.filter(c => c.type === 'ALERT').length
  },
  {
    value: 'announcements',
    label: 'Announcements',
    icon: 'pi pi-megaphone',
    count: communications.value.filter(c => c.type === 'ANNOUNCEMENT').length
  },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: 'pi pi-bell',
    count: communications.value.filter(c => c.type === 'NOTIFICATION').length
  }
])

const unreadCount = computed(() => {
  return communications.value.filter(c => !c.isRead).length
})

const filteredCommunications = computed(() => {
  let filtered = communications.value

  switch (activeTab.value) {
    case 'unread':
      filtered = filtered.filter(c => !c.isRead)
      break
    case 'alerts':
      filtered = filtered.filter(c => c.type === 'ALERT')
      break
    case 'announcements':
      filtered = filtered.filter(c => c.type === 'ANNOUNCEMENT')
      break
    case 'notifications':
      filtered = filtered.filter(c => c.type === 'NOTIFICATION')
      break
    default:
      // Show all
      break
  }

  return filtered.sort((a, b) => {
    // Unread first, then by priority, then by date
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1

    const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 }
    const aPriority = priorityOrder[a.priority] || 1
    const bPriority = priorityOrder[b.priority] || 1

    if (aPriority !== bPriority) return bPriority - aPriority

    const aDate = new Date(a.publishedAt || a.createdAt).getTime()
    const bDate = new Date(b.publishedAt || b.createdAt).getTime()
    return bDate - aDate
  })
})

const totalPages = computed(() => Math.ceil(filteredCommunications.value.length / itemsPerPage.value))

const paginatedCommunications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCommunications.value.slice(start, end)
})

const refreshCommunications = async () => {
  isLoading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  isLoading.value = false

  addNotification({
    type: 'success',
    title: 'Communications Updated',
    message: 'Latest communications have been loaded.'
  })
}

const markAllAsRead = () => {
  communications.value.forEach(c => {
    if (!c.isRead) {
      c.isRead = true
    }
  })

  addNotification({
    type: 'success',
    title: 'All Read',
    message: 'All communications have been marked as read.'
  })
}

const toggleReadStatus = (communication: Communication & { isRead: boolean }) => {
  communication.isRead = !communication.isRead

  addNotification({
    type: 'info',
    title: communication.isRead ? 'Marked as Read' : 'Marked as Unread',
    message: `"${communication.title}" has been ${communication.isRead ? 'marked as read' : 'marked as unread'}.`
  })
}

const openCommunication = (communication: Communication & { isRead: boolean }) => {
  selectedCommunication.value = communication
  if (!communication.isRead) {
    communication.isRead = true
  }
}

const closeCommunication = () => {
  selectedCommunication.value = null
}

const getCommunicationIcon = (type: string): string => {
  switch (type) {
    case 'ALERT':
      return 'pi pi-exclamation-triangle'
    case 'ANNOUNCEMENT':
      return 'pi pi-megaphone'
    case 'NOTIFICATION':
      return 'pi pi-info-circle'
    default:
      return 'pi pi-bell'
  }
}

const getCommunicationIconStyle = (type: string, priority: string): string => {
  if (priority === 'URGENT') {
    return 'bg-red-100 text-red-600'
  }
  if (priority === 'HIGH') {
    return 'bg-orange-100 text-orange-600'
  }

  switch (type) {
    case 'ALERT':
      return 'bg-yellow-100 text-yellow-600'
    case 'ANNOUNCEMENT':
      return 'bg-blue-100 text-blue-600'
    case 'NOTIFICATION':
      return 'bg-green-100 text-green-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInHours < 168) { // 7 days
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>