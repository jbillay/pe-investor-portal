import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { InvestmentApiService } from '@/services/investmentApi'
import type { Investment, InvestmentSummary } from '@/types/investment'

export const useInvestmentStore = defineStore('investments', () => {
  // State
  const investments = ref<Investment[]>([])
  const summary = ref<InvestmentSummary | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalInvestments = computed(() => investments.value.length)
  const hasInvestments = computed(() => investments.value.length > 0)

  // Actions
  async function fetchInvestments() {
    isLoading.value = true
    error.value = null
    try {
      investments.value = await InvestmentApiService.getInvestments()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch investments'
      console.error('Error fetching investments:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInvestmentSummary() {
    isLoading.value = true
    error.value = null
    try {
      summary.value = await InvestmentApiService.getInvestmentSummary()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch investment summary'
      console.error('Error fetching investment summary:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInvestmentById(id: string): Promise<Investment> {
    isLoading.value = true
    error.value = null
    try {
      const investment = await InvestmentApiService.getInvestmentById(id)
      // Update the investment in the store if it exists
      const index = investments.value.findIndex(inv => inv.id === id)
      if (index !== -1) {
        investments.value[index] = investment
      }
      return investment
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch investment'
      console.error('Error fetching investment:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refreshData() {
    await Promise.all([
      fetchInvestments(),
      fetchInvestmentSummary()
    ])
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    investments.value = []
    summary.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    investments,
    summary,
    isLoading,
    error,

    // Getters
    totalInvestments,
    hasInvestments,

    // Actions
    fetchInvestments,
    fetchInvestmentSummary,
    fetchInvestmentById,
    refreshData,
    clearError,
    reset
  }
})
