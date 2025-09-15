<template>
  <div class="space-y-6">
    <!-- Portfolio Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
          <p class="mt-1 text-gray-600">
            Track your investment performance and portfolio allocation
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Last updated</p>
          <p class="text-sm font-medium text-gray-900">{{ lastUpdated }}</p>
        </div>
      </div>
    </div>

    <!-- Portfolio Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="metric in portfolioMetrics"
        :key="metric.title"
        class="bg-white rounded-lg shadow-soft border border-gray-200 p-6"
      >
        <div class="flex items-center">
          <div :class="['flex-shrink-0 rounded-lg p-3', metric.iconBg]">
            <i :class="[metric.icon, metric.iconColor, 'text-lg']"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">{{ metric.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ metric.value }}</p>
            <p :class="['text-sm flex items-center', metric.changeColor]">
              <i :class="metric.changeIcon" class="mr-1"></i>
              {{ metric.change }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Allocation & Performance -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Asset Allocation -->
      <div class="bg-white rounded-lg shadow-soft border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Asset Allocation</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="allocation in assetAllocations"
              :key="allocation.category"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div :class="['w-4 h-4 rounded-full', allocation.color]"></div>
                <span class="text-sm font-medium text-gray-900">
                  {{ allocation.category }}
                </span>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900">
                  {{ allocation.percentage }}%
                </p>
                <p class="text-xs text-gray-500">
                  {{ allocation.value }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Chart Placeholder -->
      <div class="bg-white rounded-lg shadow-soft border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Performance Trend</h2>
        </div>
        <div class="p-6">
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div class="text-center">
              <i class="pi pi-chart-line text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-500 font-medium">Performance Chart</p>
              <p class="text-sm text-gray-400">Chart visualization would appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Holdings Table -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Holdings</h2>
          <div class="flex items-center space-x-2">
            <button
              @click="sortBy = 'name'"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                sortBy === 'name'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Name
            </button>
            <button
              @click="sortBy = 'value'"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                sortBy === 'value'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Value
            </button>
            <button
              @click="sortBy = 'performance'"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                sortBy === 'performance'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Performance
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Investment
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Investment Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Value
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="holding in sortedHoldings"
              :key="holding.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-primary-600 font-semibold text-sm">
                      {{ holding.symbol }}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ holding.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ holding.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {{ holding.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(holding.investmentDate) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">
                  {{ holding.currentValue }}
                </div>
                <div class="text-sm text-gray-500">
                  Initial: {{ holding.initialValue }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="['flex items-center text-sm font-medium', holding.performanceColor]">
                  <i :class="holding.performanceIcon" class="mr-1"></i>
                  {{ holding.performance }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ holding.absoluteReturn }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewHoldingDetails(holding)"
                    class="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
          >
            <div :class="['flex-shrink-0 rounded-full p-2', activity.iconBg]">
              <i :class="[activity.icon, activity.iconColor, 'text-sm']"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">
                {{ activity.title }}
              </p>
              <p class="text-sm text-gray-600">
                {{ activity.description }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatDate(activity.date) }}
              </p>
            </div>
            <div class="text-right">
              <p :class="['text-sm font-semibold', activity.amountColor]">
                {{ activity.amount }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const sortBy = ref('name')

const lastUpdated = ref(
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
)

const portfolioMetrics = ref([
  {
    title: 'Total Portfolio Value',
    value: '$2,485,750',
    change: '+12.5% YTD',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-chart-line',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100'
  },
  {
    title: 'Total Invested',
    value: '$2,100,000',
    change: '8 investments',
    changeColor: 'text-gray-600',
    changeIcon: 'pi pi-briefcase',
    icon: 'pi pi-money-bill',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    title: 'Unrealized Gains',
    value: '+$385,750',
    change: '+18.4%',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-trending-up',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    title: 'This Year Return',
    value: '24.7%',
    change: '+6.2% vs last year',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-percentage',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  }
])

const assetAllocations = ref([
  {
    category: 'Growth Equity',
    percentage: 45,
    value: '$1,118,588',
    color: 'bg-primary-600'
  },
  {
    category: 'Venture Capital',
    percentage: 30,
    value: '$745,725',
    color: 'bg-success-600'
  },
  {
    category: 'Real Estate',
    percentage: 20,
    value: '$497,150',
    color: 'bg-warning-600'
  },
  {
    category: 'Private Credit',
    percentage: 5,
    value: '$124,287',
    color: 'bg-info-600'
  }
])

const holdings = ref([
  {
    id: 1,
    name: 'Tech Growth Fund III',
    symbol: 'TGF',
    description: 'Late-stage technology companies',
    type: 'Growth Equity',
    investmentDate: '2023-03-15',
    initialValue: '$350,000',
    currentValue: '$428,750',
    performance: '+22.5%',
    absoluteReturn: '+$78,750',
    performanceColor: 'text-success-600',
    performanceIcon: 'pi pi-arrow-up'
  },
  {
    id: 2,
    name: 'Healthcare Innovation Fund',
    symbol: 'HIF',
    description: 'Early-stage healthcare startups',
    type: 'Venture Capital',
    investmentDate: '2023-06-20',
    initialValue: '$250,000',
    currentValue: '$312,500',
    performance: '+25.0%',
    absoluteReturn: '+$62,500',
    performanceColor: 'text-success-600',
    performanceIcon: 'pi pi-arrow-up'
  },
  {
    id: 3,
    name: 'Real Estate Opportunity Fund',
    symbol: 'REO',
    description: 'Commercial real estate investments',
    type: 'Real Estate',
    investmentDate: '2022-09-10',
    initialValue: '$500,000',
    currentValue: '$485,000',
    performance: '-3.0%',
    absoluteReturn: '-$15,000',
    performanceColor: 'text-error-600',
    performanceIcon: 'pi pi-arrow-down'
  },
  {
    id: 4,
    name: 'FinTech Ventures II',
    symbol: 'FTV',
    description: 'Financial technology companies',
    type: 'Venture Capital',
    investmentDate: '2023-01-30',
    initialValue: '$200,000',
    currentValue: '$280,000',
    performance: '+40.0%',
    absoluteReturn: '+$80,000',
    performanceColor: 'text-success-600',
    performanceIcon: 'pi pi-arrow-up'
  },
  {
    id: 5,
    name: 'Infrastructure Debt Fund',
    symbol: 'IDF',
    description: 'Infrastructure debt investments',
    type: 'Private Credit',
    investmentDate: '2022-12-05',
    initialValue: '$300,000',
    currentValue: '$315,000',
    performance: '+5.0%',
    absoluteReturn: '+$15,000',
    performanceColor: 'text-success-600',
    performanceIcon: 'pi pi-arrow-up'
  }
])

const recentActivity = ref([
  {
    id: 1,
    title: 'Distribution Received',
    description: 'Real Estate Opportunity Fund quarterly distribution',
    date: '2024-10-15',
    amount: '+$12,500',
    amountColor: 'text-success-600',
    icon: 'pi pi-money-bill',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    id: 2,
    title: 'Capital Call',
    description: 'Healthcare Innovation Fund capital call notice',
    date: '2024-10-10',
    amount: '-$25,000',
    amountColor: 'text-warning-600',
    icon: 'pi pi-credit-card',
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100'
  },
  {
    id: 3,
    title: 'Valuation Update',
    description: 'Tech Growth Fund III quarterly valuation',
    date: '2024-10-05',
    amount: '+$8,750',
    amountColor: 'text-success-600',
    icon: 'pi pi-chart-line',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  }
])

const sortedHoldings = computed(() => {
  const sorted = [...holdings.value]

  switch (sortBy.value) {
    case 'value':
      return sorted.sort((a, b) => {
        const aValue = parseFloat(a.currentValue.replace(/[$,]/g, ''))
        const bValue = parseFloat(b.currentValue.replace(/[$,]/g, ''))
        return bValue - aValue
      })
    case 'performance':
      return sorted.sort((a, b) => {
        const aPerf = parseFloat(a.performance.replace(/[+%]/g, ''))
        const bPerf = parseFloat(b.performance.replace(/[+%]/g, ''))
        return bPerf - aPerf
      })
    case 'name':
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
})

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString))
}

const viewHoldingDetails = (holding: any) => {
  // In a real app, this would navigate to a detailed view
  console.log('Viewing holding details:', holding)
}
</script>