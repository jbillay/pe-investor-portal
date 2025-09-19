<template>
  <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
      <div class="flex space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-3 py-1 text-sm rounded-lg transition-colors',
            selectedPeriod === period.value
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="relative h-80 mb-6">
      <!-- Simple chart visualization -->
      <div class="absolute inset-0 flex items-end justify-between px-4 pb-8 space-x-2">
        <div
          v-for="(point, index) in chartData"
          :key="index"
          class="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative group cursor-pointer"
          :style="{ height: `${(point.value / maxValue) * 100}%` }"
        >
          <!-- Tooltip on hover -->
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {{ point.date }}: {{ formatCurrency(point.value) }}
          </div>
          <!-- Data point circle -->
          <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
        </div>
      </div>

      <!-- Y-axis labels -->
      <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
        <span>{{ formatCurrency(maxValue) }}</span>
        <span>{{ formatCurrency(maxValue * 0.75) }}</span>
        <span>{{ formatCurrency(maxValue * 0.5) }}</span>
        <span>{{ formatCurrency(maxValue * 0.25) }}</span>
        <span>$0</span>
      </div>

      <!-- X-axis labels -->
      <div class="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
        <span v-for="(point, index) in chartData" :key="index" class="flex-1 text-center">
          {{ formatDateShort(point.date) }}
        </span>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
      <div class="text-center">
        <p class="text-sm text-gray-500">Total Return</p>
        <p :class="['text-lg font-semibold', getTotalReturn() >= 0 ? 'text-green-600' : 'text-red-600']">
          {{ formatPercentage(getTotalReturn()) }}
        </p>
      </div>
      <div class="text-center">
        <p class="text-sm text-gray-500">Period Return</p>
        <p :class="['text-lg font-semibold', getPeriodReturn() >= 0 ? 'text-green-600' : 'text-red-600']">
          {{ formatPercentage(getPeriodReturn()) }}
        </p>
      </div>
      <div class="text-center">
        <p class="text-sm text-gray-500">Best Month</p>
        <p class="text-lg font-semibold text-green-600">
          {{ formatPercentage(getBestPeriod()) }}
        </p>
      </div>
      <div class="text-center">
        <p class="text-sm text-gray-500">Volatility</p>
        <p class="text-lg font-semibold text-gray-700">
          {{ formatPercentage(getVolatility()) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface ChartDataPoint {
  date: string
  value: number
}

interface Props {
  data?: ChartDataPoint[]
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  height: '320px'
})

const selectedPeriod = ref('1Y')

const periods = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' }
]

// Mock data - in a real app, this would come from props or API
const mockData: ChartDataPoint[] = [
  { date: '2024-01-01', value: 2100000 },
  { date: '2024-02-01', value: 2150000 },
  { date: '2024-03-01', value: 2080000 },
  { date: '2024-04-01', value: 2200000 },
  { date: '2024-05-01', value: 2350000 },
  { date: '2024-06-01', value: 2280000 },
  { date: '2024-07-01', value: 2420000 },
  { date: '2024-08-01', value: 2380000 },
  { date: '2024-09-01', value: 2485750 }
]

const chartData = computed(() => {
  if (props.data?.length) {
    return props.data
  }

  // Filter data based on selected period
  const now = new Date()
  let startDate: Date

  switch (selectedPeriod.value) {
    case '1M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '3M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case '6M':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      break
    case '1Y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    default:
      return mockData
  }

  return mockData.filter(point => new Date(point.date) >= startDate)
})

const maxValue = computed(() => {
  const values = chartData.value.map(point => point.value)
  const max = Math.max(...values)
  // Add 10% padding to the top
  return max * 1.1
})

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
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
    maximumFractionDigits: 1,
    signDisplay: 'always'
  }).format(value)
}

const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short'
  }).format(date)
}

const getTotalReturn = (): number => {
  if (chartData.value.length < 2) return 0
  const first = chartData.value[0].value
  const last = chartData.value[chartData.value.length - 1].value
  return (last - first) / first
}

const getPeriodReturn = (): number => {
  // Same as total return for now - in a real app, this would be period-specific
  return getTotalReturn()
}

const getBestPeriod = (): number => {
  if (chartData.value.length < 2) return 0

  let bestReturn = -Infinity
  for (let i = 1; i < chartData.value.length; i++) {
    const previousValue = chartData.value[i - 1].value
    const currentValue = chartData.value[i].value
    const monthReturn = (currentValue - previousValue) / previousValue
    if (monthReturn > bestReturn) {
      bestReturn = monthReturn
    }
  }

  return bestReturn === -Infinity ? 0 : bestReturn
}

const getVolatility = (): number => {
  if (chartData.value.length < 3) return 0

  const returns = []
  for (let i = 1; i < chartData.value.length; i++) {
    const previousValue = chartData.value[i - 1].value
    const currentValue = chartData.value[i].value
    const monthReturn = (currentValue - previousValue) / previousValue
    returns.push(monthReturn)
  }

  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const squaredDiffs = returns.map(ret => Math.pow(ret - avgReturn, 2))
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length

  return Math.sqrt(variance)
}
</script>