import { apiClient as axiosClient } from '@/composables/useApi'
import type {
  Investment,
  InvestmentSummary,
  Fund,
  CapitalCall,
  Distribution,
  Document,
  PerformanceMetrics
} from '@/types/investment'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: any
  expiresIn: number
}

interface LogoutRequest {
  refreshToken: string
}

interface RefreshTokenRequest {
  refreshToken: string
}

// Unified API client that wraps the axios client with specific endpoint methods
export const apiClient = {
  // Authentication endpoints
  auth: {
    async login(data: LoginRequest): Promise<AuthResponse> {
      const response = await axiosClient.post('/auth/login', data)
      return response.data || response
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
      const response = await axiosClient.post('/auth/register', data)
      return response.data || response
    },

    async logout(data: LogoutRequest): Promise<{ message: string }> {
      const response = await axiosClient.post('/auth/logout', data)
      return response.data || response
    },

    async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
      const response = await axiosClient.post('/auth/refresh', data)
      return response.data || response
    },

    async getProfile(): Promise<any> {
      const response = await axiosClient.get('/auth/profile')
      return response.data || response
    }
  },

  // Investment endpoints
  investments: {
    async getAll(): Promise<Investment[]> {
      const response = await axiosClient.get('/investments')
      return response.data || response
    },

    async getById(id: string): Promise<Investment> {
      const response = await axiosClient.get(`/investments/${id}`)
      return response.data || response
    },

    async create(data: any): Promise<Investment> {
      const response = await axiosClient.post('/investments', data)
      return response.data || response
    },

    async update(id: string, data: any): Promise<Investment> {
      const response = await axiosClient.put(`/investments/${id}`, data)
      return response.data || response
    },

    async delete(id: string): Promise<void> {
      await axiosClient.delete(`/investments/${id}`)
    },

    async getSummary(): Promise<InvestmentSummary> {
      const response = await axiosClient.get('/investments/summary')
      return response.data || response
    },

    async getPerformance(id: string): Promise<{
      investment: Investment
      valuations: any[]
      performance: PerformanceMetrics
    }> {
      const response = await axiosClient.get(`/investments/${id}/performance`)
      return response.data || response
    }
  },

  // Fund endpoints
  funds: {
    async getAll(): Promise<Fund[]> {
      const response = await axiosClient.get('/funds')
      return response.data || response
    },

    async getById(id: string): Promise<Fund> {
      const response = await axiosClient.get(`/funds/${id}`)
      return response.data || response
    },

    async getUserFunds(): Promise<Fund[]> {
      const response = await axiosClient.get('/funds/my-funds')
      return response.data || response
    },

    async getByType(type: string): Promise<Fund[]> {
      const response = await axiosClient.get('/funds/by-type', { params: { type } })
      return response.data || response
    },

    async getByVintage(vintage: number): Promise<Fund[]> {
      const response = await axiosClient.get('/funds/by-vintage', { params: { vintage } })
      return response.data || response
    },

    async getSummary(id: string): Promise<{
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
      const response = await axiosClient.get(`/funds/${id}/summary`)
      return response.data || response
    },

    async getPerformance(id: string): Promise<{
      fund: Fund
      valuations: any[]
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
      const response = await axiosClient.get(`/funds/${id}/performance`)
      return response.data || response
    }
  },

  // Capital Activity endpoints
  capitalActivity: {
    async getCapitalCalls(): Promise<CapitalCall[]> {
      const response = await axiosClient.get('/capital-calls')
      return response.data || response
    },

    async getDistributions(): Promise<Distribution[]> {
      const response = await axiosClient.get('/distributions')
      return response.data || response
    }
  },

  // Document endpoints
  documents: {
    async getAll(fundId?: string): Promise<Document[]> {
      const response = await axiosClient.get('/documents', fundId ? { params: { fundId } } : undefined)
      return response.data || response
    },

    async getById(id: string): Promise<Document> {
      const response = await axiosClient.get(`/documents/${id}`)
      return response.data || response
    }
  }
}
