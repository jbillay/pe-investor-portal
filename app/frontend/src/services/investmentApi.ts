import { apiClient } from '@composables/useApi'
import type {
  Investment,
  InvestmentSummary,
  Fund,
  CapitalCall,
  Distribution,
  Communication,
  Document,
  PerformanceMetrics,
  Valuation
} from '@/types/investment'

export class InvestmentApiService {
  // Investment endpoints
  static async getInvestments(): Promise<Investment[]> {
    const response = await apiClient.get('/investments')
    return response.data || response
  }

  static async getInvestmentSummary(): Promise<InvestmentSummary> {
    const response = await apiClient.get('/investments/summary')
    return response.data || response
  }

  static async getInvestmentById(id: string): Promise<Investment> {
    const response = await apiClient.get(`/investments/${id}`)
    return response.data || response
  }

  static async getInvestmentPerformance(id: string): Promise<{
    investment: Investment
    valuations: Valuation[]
    performance: PerformanceMetrics
  }> {
    const response = await apiClient.get(`/investments/${id}/performance`)
    return response.data || response
  }

  // Fund endpoints
  static async getFunds(): Promise<Fund[]> {
    const response = await apiClient.get('/funds')
    return response.data || response
  }

  static async getUserFunds(): Promise<Fund[]> {
    const response = await apiClient.get('/funds/my-funds')
    return response.data || response
  }

  static async getFundById(id: string): Promise<Fund> {
    const response = await apiClient.get(`/funds/${id}`)
    return response.data || response
  }

  static async getFundSummary(id: string): Promise<{
    fund: Fund
    investorCount: number
    totalInvestorCommitment: number
    totalDrawn: number
    totalDistributed: number
    currentNav: number
    irr?: number
    multiple?: number
    latestValuationDate?: string
  }> {
    const response = await apiClient.get(`/funds/${id}/summary`)
    return response.data || response
  }

  static async getFundPerformance(id: string): Promise<{
    fund: Fund
    valuations: Valuation[]
    capitalCalls: CapitalCall[]
    distributions: Distribution[]
    performance: {
      currentNav: number
      irr: number
      multiple: number
      totalCommitted: number
      totalDrawn: number
      totalDistributed: number
      unrealizedValue: number
      realizedValue: number
    }
  }> {
    const response = await apiClient.get(`/funds/${id}/performance`)
    return response.data || response
  }

  // Capital calls endpoints
  static async getCapitalCalls(): Promise<CapitalCall[]> {
    const response = await apiClient.get('/capital-calls')
    return response.data || response
  }

  static async getPendingCapitalCalls(): Promise<CapitalCall[]> {
    const response = await apiClient.get('/capital-calls?status=PENDING')
    return response.data || response
  }

  // Distributions endpoints
  static async getDistributions(): Promise<Distribution[]> {
    const response = await apiClient.get('/distributions')
    return response.data || response
  }

  static async getRecentDistributions(): Promise<Distribution[]> {
    const response = await apiClient.get('/distributions?recent=true')
    return response.data || response
  }

  // Communications endpoints
  static async getCommunications(): Promise<Communication[]> {
    const response = await apiClient.get('/communications')
    return response.data || response
  }

  static async getRecentCommunications(): Promise<Communication[]> {
    const response = await apiClient.get('/communications?recent=true')
    return response.data || response
  }

  // Documents endpoints
  static async getDocuments(): Promise<Document[]> {
    const response = await apiClient.get('/documents')
    return response.data || response
  }

  static async getDocumentsByType(type: string): Promise<Document[]> {
    const response = await apiClient.get(`/documents?type=${type}`)
    return response.data || response
  }

  static async getDocumentsByFund(fundId: string): Promise<Document[]> {
    const response = await apiClient.get(`/documents?fundId=${fundId}`)
    return response.data || response
  }

  // Dashboard data endpoint
  static async getDashboardData(): Promise<{
    summary: InvestmentSummary
    recentActivities: Array<{
      id: string
      type: 'CAPITAL_CALL' | 'DISTRIBUTION' | 'DOCUMENT' | 'COMMUNICATION'
      title: string
      description: string
      date: string
      amount?: number
      status?: string
      fundName?: string
    }>
    portfolioHoldings: Investment[]
    pendingActions: Array<{
      id: string
      type: 'CAPITAL_CALL_DUE' | 'DOCUMENT_REVIEW' | 'FORM_SUBMISSION'
      title: string
      description: string
      dueDate?: string
      priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
    }>
  }> {
    const response = await apiClient.get('/dashboard')
    return response.data || response
  }
}