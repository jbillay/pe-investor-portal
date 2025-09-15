<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Welcome back, {{ authStore.user?.firstName }}!
          </h1>
          <p class="mt-1 text-gray-600">
            Here's what's happening with your investments today.
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <i class="pi pi-calendar"></i>
            <span>{{ currentDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in quickStats"
        :key="stat.title"
        class="bg-white rounded-lg shadow-soft border border-gray-200 p-6"
      >
        <div class="flex items-center">
          <div :class="['flex-shrink-0 rounded-lg p-3', stat.iconBg]">
            <i :class="[stat.icon, stat.iconColor, 'text-lg']"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">{{ stat.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            <p :class="['text-sm flex items-center', stat.changeColor]">
              <i :class="stat.changeIcon" class="mr-1"></i>
              {{ stat.change }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow-soft border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="activity in recentActivities"
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
                  {{ activity.timestamp }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-6">
            <router-link
              to="/activity"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              View all activity →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Portfolio Summary -->
      <div class="bg-white rounded-lg shadow-soft border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Portfolio Summary</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="holding in portfolioHoldings"
              :key="holding.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ holding.symbol }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ holding.name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ holding.type }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900">
                  {{ holding.value }}
                </p>
                <p :class="['text-xs flex items-center justify-end', holding.changeColor]">
                  <i :class="holding.changeIcon" class="mr-1"></i>
                  {{ holding.change }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-6">
            <router-link
              to="/portfolio"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              View full portfolio →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          v-for="action in quickActions"
          :key="action.title"
          @click="handleQuickAction(action.action)"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <div :class="['flex-shrink-0 rounded-lg p-2', action.iconBg]">
            <i :class="[action.icon, action.iconColor, 'text-lg']"></i>
          </div>
          <div class="ml-3 text-left">
            <p class="text-sm font-medium text-gray-900">{{ action.title }}</p>
            <p class="text-xs text-gray-500">{{ action.description }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date())
})

// Mock data - in a real app, this would come from API calls
const quickStats = ref([
  {
    title: 'Total Portfolio Value',
    value: '$2.4M',
    change: '+12.5%',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-chart-line',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100'
  },
  {
    title: 'Active Investments',
    value: '8',
    change: '+2 this month',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-briefcase',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    title: 'Documents',
    value: '24',
    change: '3 pending review',
    changeColor: 'text-warning-600',
    changeIcon: 'pi pi-clock',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  },
  {
    title: 'YTD Return',
    value: '18.7%',
    change: '+3.2% vs last year',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up',
    icon: 'pi pi-trending-up',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  }
])

const recentActivities = ref([
  {
    id: 1,
    title: 'Quarterly Report Available',
    description: 'Tech Growth Fund Q3 2024 report is ready for review',
    timestamp: '2 hours ago',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  },
  {
    id: 2,
    title: 'Capital Call Notice',
    description: 'Healthcare Innovation Fund - $50K requested',
    timestamp: '1 day ago',
    icon: 'pi pi-credit-card',
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-100'
  },
  {
    id: 3,
    title: 'Distribution Received',
    description: 'Real Estate Opportunity Fund - $25K distributed',
    timestamp: '3 days ago',
    icon: 'pi pi-money-bill',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  }
])

const portfolioHoldings = ref([
  {
    id: 1,
    name: 'Tech Growth Fund III',
    symbol: 'TGF',
    type: 'Growth Equity',
    value: '$850K',
    change: '+15.2%',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up'
  },
  {
    id: 2,
    name: 'Healthcare Innovation',
    symbol: 'HIF',
    type: 'Venture Capital',
    value: '$620K',
    change: '+8.7%',
    changeColor: 'text-success-600',
    changeIcon: 'pi pi-arrow-up'
  },
  {
    id: 3,
    name: 'Real Estate Opportunity',
    symbol: 'REO',
    type: 'Real Estate',
    value: '$980K',
    change: '-2.1%',
    changeColor: 'text-error-600',
    changeIcon: 'pi pi-arrow-down'
  }
])

const quickActions = ref([
  {
    title: 'View Documents',
    description: 'Access reports & statements',
    action: 'documents',
    icon: 'pi pi-file-pdf',
    iconColor: 'text-info-600',
    iconBg: 'bg-info-100'
  },
  {
    title: 'Portfolio Details',
    description: 'View investment breakdown',
    action: 'portfolio',
    icon: 'pi pi-chart-pie',
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-100'
  },
  {
    title: 'Contact Manager',
    description: 'Reach out to your team',
    action: 'contact',
    icon: 'pi pi-envelope',
    iconColor: 'text-success-600',
    iconBg: 'bg-success-100'
  },
  {
    title: 'Account Settings',
    description: 'Update your preferences',
    action: 'settings',
    icon: 'pi pi-cog',
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100'
  }
])

const handleQuickAction = (action: string) => {
  switch (action) {
    case 'documents':
      router.push('/documents')
      break
    case 'portfolio':
      router.push('/portfolio')
      break
    case 'contact':
      router.push('/contact')
      break
    case 'settings':
      router.push('/settings')
      break
    default:
      console.log('Unknown action:', action)
  }
}

onMounted(async () => {
  // In a real app, you'd fetch dashboard data here
  // await loadDashboardData()
})
</script>