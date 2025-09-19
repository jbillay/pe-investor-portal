<template>
  <div class="bg-white rounded-lg shadow-soft border border-gray-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="pi pi-bell text-blue-600"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <p class="text-sm text-gray-600">Important notifications and updates</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="unreadCount > 0" class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            {{ unreadCount }} unread
          </span>
          <button
            @click="markAllAsRead"
            v-if="unreadCount > 0"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all read
          </button>
        </div>
      </div>
    </div>

    <!-- Alerts List -->
    <div class="max-h-96 overflow-y-auto">
      <div v-if="alerts.length === 0" class="p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <i class="pi pi-bell text-gray-400 text-2xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
        <p class="text-gray-600">You're all caught up! Check back later for new notifications.</p>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="alert in sortedAlerts"
          :key="alert.id"
          :class="[
            'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
            !alert.isRead ? 'bg-blue-50' : ''
          ]"
          @click="markAsRead(alert)"
        >
          <div class="flex items-start space-x-3">
            <!-- Alert Icon -->
            <div
              :class="[
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1',
                getAlertIconStyle(alert.type, alert.priority)
              ]"
            >
              <i :class="[getAlertIcon(alert.type), 'text-sm']"></i>
            </div>

            <!-- Alert Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h4 :class="['text-sm font-medium', !alert.isRead ? 'text-gray-900' : 'text-gray-700']">
                      {{ alert.title }}
                    </h4>
                    <span
                      v-if="alert.priority === 'URGENT'"
                      class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                    >
                      URGENT
                    </span>
                    <span
                      v-else-if="alert.priority === 'HIGH'"
                      class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                    >
                      HIGH
                    </span>
                  </div>
                  <p :class="['text-sm mb-2', !alert.isRead ? 'text-gray-700' : 'text-gray-600']">
                    {{ alert.content }}
                  </p>
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span class="flex items-center">
                      <i class="pi pi-clock mr-1"></i>
                      {{ formatDate(alert.publishedAt || alert.createdAt) }}
                    </span>
                    <span v-if="alert.fundId" class="flex items-center">
                      <i class="pi pi-building mr-1"></i>
                      Fund Alert
                    </span>
                    <span v-else class="flex items-center">
                      <i class="pi pi-globe mr-1"></i>
                      Global Alert
                    </span>
                  </div>
                </div>

                <!-- Unread Indicator -->
                <div v-if="!alert.isRead" class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div v-if="alerts.length > 0" class="px-6 py-3 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">
          Showing {{ alerts.length }} alert{{ alerts.length !== 1 ? 's' : '' }}
        </span>
        <button
          @click="$emit('viewAll')"
          class="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all alerts
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Communication } from '@/types/investment'

interface Props {
  alerts?: Communication[]
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  alerts: () => [],
  maxItems: 5
})

const emit = defineEmits<{
  viewAll: []
  alertRead: [alert: Communication]
  allRead: []
}>()

// Mock alerts data
const mockAlerts: Communication[] = [
  {
    id: '1',
    fundId: 'fund-1',
    title: 'Capital Call Notice - Healthcare Fund II',
    content: 'A new capital call of $2.5M has been issued for Healthcare Fund II. Payment due within 10 business days.',
    type: 'ALERT',
    priority: 'HIGH',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'PUBLISHED',
    publishedBy: 'Fund Administrator',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Quarterly Investor Portal Maintenance',
    content: 'The investor portal will undergo scheduled maintenance on Sunday, October 22nd from 2:00 AM to 6:00 AM EST.',
    type: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    isGlobal: true,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: 'PUBLISHED',
    publishedBy: 'System Administrator',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    fundId: 'fund-2',
    title: 'Distribution Payment Processed',
    content: 'Your Q3 distribution payment of $125,000 has been processed and will be credited to your account within 2-3 business days.',
    type: 'NOTIFICATION',
    priority: 'NORMAL',
    targetAudience: 'SPECIFIC',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'PUBLISHED',
    publishedBy: 'Finance Team',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'New Document Available: Q3 Financial Report',
    content: 'The Q3 financial report is now available in your document library. Please review and contact us with any questions.',
    type: 'NOTIFICATION',
    priority: 'NORMAL',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'PUBLISHED',
    publishedBy: 'Investment Team',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    fundId: 'fund-1',
    title: 'Portfolio Company Exit - TechStart Inc.',
    content: 'We are pleased to announce the successful exit of TechStart Inc. from Healthcare Fund II, resulting in a 3.2x return on investment.',
    type: 'ANNOUNCEMENT',
    priority: 'HIGH',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    status: 'PUBLISHED',
    publishedBy: 'Investment Team',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const alerts = ref<(Communication & { isRead: boolean })[]>(
  props.alerts.length > 0
    ? props.alerts.map(alert => ({ ...alert, isRead: false }))
    : mockAlerts
)

const sortedAlerts = computed(() => {
  return alerts.value
    .slice(0, props.maxItems)
    .sort((a, b) => {
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

const unreadCount = computed(() => {
  return alerts.value.filter(alert => !alert.isRead).length
})

const markAsRead = (alert: Communication & { isRead: boolean }) => {
  if (!alert.isRead) {
    alert.isRead = true
    emit('alertRead', alert)
  }
}

const markAllAsRead = () => {
  alerts.value.forEach(alert => {
    if (!alert.isRead) {
      alert.isRead = true
    }
  })
  emit('allRead')
}

const getAlertIcon = (type: string): string => {
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

const getAlertIconStyle = (type: string, priority: string): string => {
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