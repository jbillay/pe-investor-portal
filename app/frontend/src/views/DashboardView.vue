<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg text-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">
            Welcome back, {{ authStore.user?.firstName }}!
          </h1>
          <p class="mt-2 text-blue-100">
            Track your private equity investments, capital calls, and portfolio performance.
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="flex flex-col items-end space-y-1">
            <div class="flex items-center space-x-2 text-blue-100">
              <i class="pi pi-calendar"></i>
              <span>{{ currentDate }}</span>
            </div>
            <div class="text-blue-200 text-sm">
              Last updated: {{ lastUpdated }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-green-100">
            <i class="pi pi-chart-line text-green-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Portfolio Value</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(summary?.totalCurrentValue || 0) }}</p>
            <p class="text-sm flex items-center text-green-600">
              <i class="pi pi-arrow-up mr-1"></i>
              {{ formatPercentage(summary?.overallIrr || 0) }} IRR
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-blue-100">
            <i class="pi pi-briefcase text-blue-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Active Investments</p>
            <p class="text-2xl font-bold text-gray-900">{{ summary?.totalInvestments || 0 }}</p>
            <p class="text-sm text-gray-500">
              {{ formatCurrency(summary?.totalCommitted || 0) }} committed
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-purple-100">
            <i class="pi pi-money-bill text-purple-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Distributions</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(summary?.totalDistributed || 0) }}</p>
            <p class="text-sm text-gray-500">
              Realized returns
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-orange-100">
            <i class="pi pi-trending-up text-orange-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Multiple</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatMultiple(summary?.overallMultiple || 0) }}x</p>
            <p class="text-sm text-gray-500">
              Overall performance
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Activity -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow-lg border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="pi pi-clock mr-2 text-blue-600"></i>
            Recent Activity
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4" v-if="recentActivities.length > 0">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div :class="getActivityIcon(activity.type)">
                <i :class="getActivityIconClass(activity.type)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900">
                    {{ activity.title }}
                  </p>
                  <span v-if="activity.amount" class="text-sm font-semibold text-green-600">
                    {{ formatCurrency(activity.amount) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ activity.description }}
                </p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-xs text-gray-500">
                    {{ formatRelativeTime(activity.date) }}
                  </p>
                  <span v-if="activity.fundName" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {{ activity.fundName }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <i class="pi pi-inbox text-gray-400 text-3xl mb-3"></i>
            <p class="text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>

      <!-- Pending Actions -->
      <div class="bg-white rounded-lg shadow-lg border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="pi pi-exclamation-triangle mr-2 text-orange-600"></i>
            Pending Actions
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4" v-if="pendingActions.length > 0">
            <div
              v-for="action in pendingActions"
              :key="action.id"
              class="p-4 rounded-lg border-l-4 hover:bg-gray-50 transition-colors"
              :class="getPriorityBorderClass(action.priority)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ action.title }}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ action.description }}
                  </p>
                  <div class="flex items-center mt-2 space-x-3">
                    <span v-if="action.dueDate" class="text-xs text-gray-500">
                      Due: {{ formatDate(action.dueDate) }}
                    </span>
                    <span :class="getPriorityTextClass(action.priority)" class="text-xs font-medium">
                      {{ action.priority }}
                    </span>
                  </div>
                </div>
                <button
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  @click="handlePendingAction(action)"
                >
                  {{ getActionButtonText(action.type) }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <i class="pi pi-check-circle text-green-400 text-3xl mb-3"></i>
            <p class="text-gray-500">All caught up!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Alerts -->
    <AlertsPanel
      :max-items="3"
      @view-all="$router.push('/communications')"
    />

    <!-- Portfolio Holdings -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="pi pi-chart-pie mr-2 text-purple-600"></i>
            Portfolio Holdings
          </h2>
          <router-link
            to="/portfolio"
            class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Details →
          </router-link>
        </div>
      </div>
      <div class="p-6">
        <div class="space-y-4" v-if="portfolioHoldings.length > 0">
          <div
            v-for="investment in portfolioHoldings"
            :key="investment.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="() => router.push(`/portfolio/${investment.id}`)"
          >
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                <span class="text-blue-700 font-bold text-sm">
                  {{ getFundSymbol(investment.fund?.name) }}
                </span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ investment.fund?.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ investment.fund?.fundType }} • {{ investment.fund?.vintage }}
                </p>
                <p class="text-xs text-gray-600 mt-1">
                  Commitment: {{ formatCurrency(investment.commitmentAmount) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">
                {{ formatCurrency(investment.currentValue) }}
              </p>
              <p class="text-xs text-gray-500">
                Current Value
              </p>
              <div class="flex items-center justify-end mt-1">
                <span :class="getPerformanceColor(investment.irr)" class="text-xs font-medium">
                  {{ formatPercentage(investment.irr || 0) }} IRR
                </span>
                <span class="mx-1 text-xs text-gray-400">•</span>
                <span class="text-xs font-medium text-gray-600">
                  {{ formatMultiple(investment.multiple || 0) }}x
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8">
          <i class="pi pi-chart-pie text-gray-400 text-3xl mb-3"></i>
          <p class="text-gray-500">No investments yet</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { MockInvestmentApiService } from '../services/mockData'
import type { InvestmentSummary, Investment } from '../types/investment'
import AlertsPanel from '../components/communications/AlertsPanel.vue'

const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const isLoading = ref(true)
const summary = ref<InvestmentSummary | null>(null)
const recentActivities = ref<any[]>([])
const portfolioHoldings = ref<Investment[]>([])
const pendingActions = ref<any[]>([])

// Computed properties
const currentDate = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date())
})

const lastUpdated = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date())
})

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)
}

const formatMultiple = (value: number): string => {
  return value.toFixed(2)
}

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hours ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} days ago`

  return formatDate(dateString)
}

const getFundSymbol = (fundName?: string): string => {
  if (!fundName) return '??'
  const words = fundName.split(' ')
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return fundName.charAt(0).toUpperCase()
}

const getPerformanceColor = (irr?: number): string => {
  if (!irr) return 'text-gray-500'
  return irr >= 0 ? 'text-green-600' : 'text-red-600'
}

const getActivityIcon = (type: string): string => {
  const baseClasses = 'flex-shrink-0 rounded-full p-2'
  switch (type) {
    case 'CAPITAL_CALL':
      return `${baseClasses} bg-orange-100`
    case 'DISTRIBUTION':
      return `${baseClasses} bg-green-100`
    case 'DOCUMENT':
      return `${baseClasses} bg-blue-100`
    case 'COMMUNICATION':
      return `${baseClasses} bg-purple-100`
    default:
      return `${baseClasses} bg-gray-100`
  }
}

const getActivityIconClass = (type: string): string => {
  switch (type) {
    case 'CAPITAL_CALL':
      return 'pi pi-credit-card text-orange-600 text-sm'
    case 'DISTRIBUTION':
      return 'pi pi-money-bill text-green-600 text-sm'
    case 'DOCUMENT':
      return 'pi pi-file-pdf text-blue-600 text-sm'
    case 'COMMUNICATION':
      return 'pi pi-bell text-purple-600 text-sm'
    default:
      return 'pi pi-info-circle text-gray-600 text-sm'
  }
}

const getPriorityBorderClass = (priority: string): string => {
  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return 'border-red-500'
    case 'NORMAL':
      return 'border-blue-500'
    case 'LOW':
      return 'border-gray-300'
    default:
      return 'border-gray-300'
  }
}

const getPriorityTextClass = (priority: string): string => {
  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return 'text-red-600'
    case 'NORMAL':
      return 'text-blue-600'
    case 'LOW':
      return 'text-gray-500'
    default:
      return 'text-gray-500'
  }
}

const getActionButtonText = (type: string): string => {
  switch (type) {
    case 'CAPITAL_CALL_DUE':
      return 'Pay Now'
    case 'DOCUMENT_REVIEW':
      return 'Review'
    case 'FORM_SUBMISSION':
      return 'Submit'
    default:
      return 'View'
  }
}

// Event handlers
const handlePendingAction = (action: any) => {
  switch (action.type) {
    case 'CAPITAL_CALL_DUE':
      router.push('/capital-calls')
      break
    case 'DOCUMENT_REVIEW':
      router.push('/documents')
      break
    case 'FORM_SUBMISSION':
      router.push('/settings')
      break
    default:
      console.log('Unknown action type:', action.type)
  }
}

// Data loading
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    const data = await MockInvestmentApiService.getDashboardData()

    summary.value = data.summary
    recentActivities.value = data.recentActivities
    portfolioHoldings.value = data.portfolioHoldings
    pendingActions.value = data.pendingActions
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadDashboardData()
})
</script>