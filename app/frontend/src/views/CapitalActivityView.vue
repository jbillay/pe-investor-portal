<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg text-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Capital Activity</h1>
          <p class="mt-2 text-blue-100">
            Track capital calls, distributions, and pending transactions across your portfolio.
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="text-right">
            <p class="text-blue-200 text-sm">Total Outstanding</p>
            <p class="text-2xl font-bold">{{ formatCurrency(totalOutstanding) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-orange-100">
            <i class="pi pi-credit-card text-orange-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Pending Capital Calls</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(pendingCapitalCalls) }}</p>
            <p class="text-sm text-orange-600">{{ pendingCallsCount }} calls due</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-green-100">
            <i class="pi pi-money-bill text-green-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">YTD Distributions</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(ytdDistributions) }}</p>
            <p class="text-sm text-green-600">{{ distributionsCount }} received</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 rounded-lg p-3 bg-blue-100">
            <i class="pi pi-chart-line text-blue-600 text-lg"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Capital Drawn</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalDrawn) }}</p>
            <p class="text-sm text-blue-600">{{ formatPercentage(drawdownRate) }} of commitments</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Filter Tabs -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-100">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i :class="tab.icon" class="mr-2"></i>
            {{ tab.label }}
            <span
              v-if="tab.count"
              :class="[
                'ml-2 py-0.5 px-2 rounded-full text-xs',
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Activity Content -->
      <div class="p-6">
        <!-- Capital Calls Tab -->
        <div v-if="activeTab === 'capital-calls'" class="space-y-4">
          <div
            v-for="call in capitalCalls"
            :key="call.id"
            class="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <span class="text-blue-700 font-bold text-sm">
                      {{ getFundSymbol(call.fundName) }}
                    </span>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{{ call.fundName }}</h3>
                    <p class="text-sm text-gray-600">Call #{{ call.callNumber }} • {{ call.purpose }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p class="text-sm text-gray-500">Amount Called</p>
                    <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(call.amountCalled) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Due Date</p>
                    <p class="text-sm font-medium text-gray-900">{{ formatDate(call.dueDate) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <span :class="getStatusClass(call.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ call.status }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">Call Date: {{ formatDate(call.callDate) }}</span>
                    <span v-if="call.status === 'PENDING'" :class="getDueDateClass(call.dueDate)" class="text-sm font-medium">
                      {{ getDaysUntilDue(call.dueDate) }}
                    </span>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      v-if="call.status === 'PENDING'"
                      @click="payCapitalCall(call)"
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Pay Now
                    </button>
                    <button
                      @click="viewCapitalCallDetails(call)"
                      class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="capitalCalls.length === 0" class="text-center py-12">
            <i class="pi pi-credit-card text-gray-400 text-4xl mb-4"></i>
            <p class="text-gray-500 font-medium">No capital calls</p>
            <p class="text-sm text-gray-400">You're all caught up with capital call payments</p>
          </div>
        </div>

        <!-- Distributions Tab -->
        <div v-if="activeTab === 'distributions'" class="space-y-4">
          <div
            v-for="distribution in distributions"
            :key="distribution.id"
            class="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                    <span class="text-green-700 font-bold text-sm">
                      {{ getFundSymbol(distribution.fundName) }}
                    </span>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{{ distribution.fundName }}</h3>
                    <p class="text-sm text-gray-600">Distribution #{{ distribution.distributionNumber }} • {{ distribution.distributionType.replace('_', ' ') }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p class="text-sm text-gray-500">Gross Amount</p>
                    <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(distribution.amount) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Tax Withholding</p>
                    <p class="text-sm font-medium text-red-600">{{ formatCurrency(distribution.taxWithholding || 0) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Net Amount</p>
                    <p class="text-lg font-semibold text-green-600">{{ formatCurrency(distribution.netAmount) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Payment Date</p>
                    <p class="text-sm font-medium text-gray-900">{{ formatDate(distribution.paymentDate) }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500">Record Date: {{ formatDate(distribution.recordDate) }}</span>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="downloadTaxDocument(distribution)"
                      class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Tax Document
                    </button>
                    <button
                      @click="viewDistributionDetails(distribution)"
                      class="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="distributions.length === 0" class="text-center py-12">
            <i class="pi pi-money-bill text-gray-400 text-4xl mb-4"></i>
            <p class="text-gray-500 font-medium">No distributions yet</p>
            <p class="text-sm text-gray-400">Distributions will appear here when available</p>
          </div>
        </div>

        <!-- Activity History Tab -->
        <div v-if="activeTab === 'history'" class="space-y-4">
          <div class="space-y-4">
            <div
              v-for="activity in activityHistory"
              :key="activity.id"
              class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div :class="getActivityIcon(activity.type)">
                <i :class="getActivityIconClass(activity.type)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
                  <span :class="getAmountColor(activity.amount)" class="text-sm font-semibold">
                    {{ formatCurrency(Math.abs(activity.amount)) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">{{ activity.description }}</p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-xs text-gray-500">{{ formatRelativeTime(activity.date) }}</p>
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {{ activity.fundName }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activityHistory.length === 0" class="text-center py-12">
            <i class="pi pi-history text-gray-400 text-4xl mb-4"></i>
            <p class="text-gray-500 font-medium">No activity history</p>
            <p class="text-sm text-gray-400">Capital activity will be tracked here</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MockInvestmentApiService } from '../services/mockData'
import type { CapitalCall, Distribution } from '../types/investment'

// Reactive data
const isLoading = ref(true)
const activeTab = ref('capital-calls')
const capitalCalls = ref<CapitalCall[]>([])
const distributions = ref<Distribution[]>([])
const activityHistory = ref<any[]>([])

// Tab configuration
const tabs = computed(() => [
  {
    key: 'capital-calls',
    label: 'Capital Calls',
    icon: 'pi pi-credit-card',
    count: capitalCalls.value.length
  },
  {
    key: 'distributions',
    label: 'Distributions',
    icon: 'pi pi-money-bill',
    count: distributions.value.length
  },
  {
    key: 'history',
    label: 'Activity History',
    icon: 'pi pi-history',
    count: activityHistory.value.length
  }
])

// Computed metrics
const pendingCapitalCalls = computed(() => {
  return capitalCalls.value
    .filter(call => call.status === 'PENDING')
    .reduce((sum, call) => sum + (call.amountCalled || 0), 0)
})

const pendingCallsCount = computed(() => {
  return capitalCalls.value.filter(call => call.status === 'PENDING').length
})

const ytdDistributions = computed(() => {
  const currentYear = new Date().getFullYear()
  return distributions.value
    .filter(dist => new Date(dist.paymentDate).getFullYear() === currentYear)
    .reduce((sum, dist) => sum + (dist.netAmount || 0), 0)
})

const distributionsCount = computed(() => {
  const currentYear = new Date().getFullYear()
  return distributions.value.filter(dist => new Date(dist.paymentDate).getFullYear() === currentYear).length
})

const totalDrawn = computed(() => {
  // This would come from investment summary
  return 2740000
})

const totalOutstanding = computed(() => {
  return pendingCapitalCalls.value
})

const drawdownRate = computed(() => {
  const totalCommitted = 6500000 // This would come from investment summary
  return totalCommitted > 0 ? totalDrawn.value / totalCommitted : 0
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

const getFundSymbol = (fundName: string): string => {
  const words = fundName.split(' ')
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return fundName.charAt(0).toUpperCase()
}

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-orange-100 text-orange-800'
    case 'FUNDED':
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getDueDateClass = (dueDate: string): string => {
  const days = getDaysUntilDueNumber(dueDate)
  if (days < 0) return 'text-red-600'
  if (days <= 7) return 'text-orange-600'
  return 'text-green-600'
}

const getDaysUntilDue = (dueDate: string): string => {
  const days = getDaysUntilDueNumber(dueDate)
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

const getDaysUntilDueNumber = (dueDate: string): number => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getActivityIcon = (type: string): string => {
  const baseClasses = 'flex-shrink-0 rounded-full p-2'
  switch (type) {
    case 'CAPITAL_CALL':
      return `${baseClasses} bg-orange-100`
    case 'DISTRIBUTION':
      return `${baseClasses} bg-green-100`
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
    default:
      return 'pi pi-info-circle text-gray-600 text-sm'
  }
}

const getAmountColor = (amount: number): string => {
  return amount >= 0 ? 'text-green-600' : 'text-red-600'
}

// Event handlers
const payCapitalCall = (call: CapitalCall) => {
  console.log('Paying capital call:', call)
  // In a real app, this would open a payment flow
}

const viewCapitalCallDetails = (call: CapitalCall) => {
  console.log('Viewing capital call details:', call)
  // In a real app, this would navigate to details view
}

const viewDistributionDetails = (distribution: Distribution) => {
  console.log('Viewing distribution details:', distribution)
  // In a real app, this would navigate to details view
}

const downloadTaxDocument = (distribution: Distribution) => {
  console.log('Downloading tax document for:', distribution)
  // In a real app, this would download the tax document
}

// Data loading
const loadCapitalActivityData = async () => {
  try {
    isLoading.value = true
    const [callsData, distributionsData] = await Promise.all([
      MockInvestmentApiService.getCapitalCalls(),
      MockInvestmentApiService.getDistributions()
    ])

    capitalCalls.value = callsData.map(call => ({
      ...call,
      fundName: call.fundId === 'fund-1' ? 'Tech Growth Fund III' :
                call.fundId === 'fund-2' ? 'Healthcare Innovation Fund II' : 'Unknown Fund'
    }))

    distributions.value = distributionsData.map(dist => ({
      ...dist,
      fundName: dist.fundId === 'fund-1' ? 'Tech Growth Fund III' :
                dist.fundId === 'fund-2' ? 'Healthcare Innovation Fund II' :
                dist.fundId === 'fund-3' ? 'Real Estate Opportunity Fund IV' : 'Unknown Fund'
    }))

    // Combine capital calls and distributions for activity history
    activityHistory.value = [
      ...capitalCalls.value.map(call => ({
        id: `cc-${call.id}`,
        type: 'CAPITAL_CALL',
        title: 'Capital Call',
        description: `Call #${call.callNumber} - ${call.purpose}`,
        date: call.callDate,
        amount: -(call.amountCalled || 0),
        fundName: call.fundName
      })),
      ...distributions.value.map(dist => ({
        id: `dist-${dist.id}`,
        type: 'DISTRIBUTION',
        title: 'Distribution Received',
        description: `Distribution #${dist.distributionNumber} - ${dist.distributionType.replace('_', ' ')}`,
        date: dist.paymentDate,
        amount: dist.netAmount || 0,
        fundName: dist.fundName
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Failed to load capital activity data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadCapitalActivityData()
})
</script>