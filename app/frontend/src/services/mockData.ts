import type {
  Investment,
  InvestmentSummary,
  Fund,
  CapitalCall,
  Distribution,
  Communication,
  Document
} from '@/types/investment'

// Mock data for development
export const mockFunds: Fund[] = [
  {
    id: 'fund-1',
    name: 'Tech Growth Fund III',
    description: 'Late-stage technology growth investments focusing on SaaS and fintech companies',
    fundType: 'GROWTH',
    vintage: 2023,
    targetSize: 500000000,
    commitedSize: 425000000,
    drawnSize: 85000000,
    currency: 'USD',
    status: 'ACTIVE',
    closeDate: '2023-06-30',
    managementFee: 0.02,
    carriedInterest: 0.20,
    isActive: true,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z'
  },
  {
    id: 'fund-2',
    name: 'Healthcare Innovation Fund II',
    description: 'Early-stage healthcare and biotech venture capital investments',
    fundType: 'VC',
    vintage: 2022,
    targetSize: 300000000,
    commitedSize: 280000000,
    drawnSize: 120000000,
    currency: 'USD',
    status: 'ACTIVE',
    closeDate: '2022-12-15',
    managementFee: 0.025,
    carriedInterest: 0.20,
    isActive: true,
    createdAt: '2022-06-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z'
  },
  {
    id: 'fund-3',
    name: 'Real Estate Opportunity Fund IV',
    description: 'Commercial real estate investments in tier-1 markets',
    fundType: 'REAL_ESTATE',
    vintage: 2021,
    targetSize: 750000000,
    commitedSize: 750000000,
    drawnSize: 450000000,
    currency: 'USD',
    status: 'CLOSED',
    closeDate: '2021-09-30',
    finalClose: '2021-12-15',
    managementFee: 0.015,
    carriedInterest: 0.15,
    isActive: true,
    createdAt: '2021-03-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z'
  }
]

export const mockInvestments: Investment[] = [
  {
    id: 'inv-1',
    userId: 'user-1',
    fundId: 'fund-1',
    commitmentAmount: 2000000,
    drawnAmount: 340000,
    distributedAmount: 75000,
    currentValue: 425000,
    irr: 0.187,
    multiple: 1.47,
    status: 'ACTIVE',
    investmentDate: '2023-07-15T00:00:00Z',
    isActive: true,
    createdAt: '2023-07-15T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
    fund: {
      id: 'fund-1',
      name: 'Tech Growth Fund III',
      fundType: 'GROWTH',
      vintage: 2023,
      currency: 'USD',
      status: 'ACTIVE'
    }
  },
  {
    id: 'inv-2',
    userId: 'user-1',
    fundId: 'fund-2',
    commitmentAmount: 1500000,
    drawnAmount: 600000,
    distributedAmount: 125000,
    currentValue: 720000,
    irr: 0.145,
    multiple: 1.41,
    status: 'ACTIVE',
    investmentDate: '2022-12-20T00:00:00Z',
    isActive: true,
    createdAt: '2022-12-20T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
    fund: {
      id: 'fund-2',
      name: 'Healthcare Innovation Fund II',
      fundType: 'VC',
      vintage: 2022,
      currency: 'USD',
      status: 'ACTIVE'
    }
  },
  {
    id: 'inv-3',
    userId: 'user-1',
    fundId: 'fund-3',
    commitmentAmount: 3000000,
    drawnAmount: 1800000,
    distributedAmount: 320000,
    currentValue: 1950000,
    irr: 0.092,
    multiple: 1.26,
    status: 'ACTIVE',
    investmentDate: '2021-10-01T00:00:00Z',
    isActive: true,
    createdAt: '2021-10-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
    fund: {
      id: 'fund-3',
      name: 'Real Estate Opportunity Fund IV',
      fundType: 'REAL_ESTATE',
      vintage: 2021,
      currency: 'USD',
      status: 'CLOSED'
    }
  }
]

export const mockInvestmentSummary: InvestmentSummary = {
  totalInvestments: 3,
  totalCommitted: 6500000,
  totalDrawn: 2740000,
  totalDistributed: 520000,
  totalCurrentValue: 3095000,
  overallIrr: 0.141,
  overallMultiple: 1.32,
  unfundedCommitment: 3760000
}

export const mockCapitalCalls: CapitalCall[] = [
  {
    id: 'cc-1',
    fundId: 'fund-1',
    callNumber: 3,
    totalAmount: 25000000,
    purpose: 'Portfolio company follow-on investment',
    callDate: '2024-09-01T00:00:00Z',
    dueDate: '2024-10-15T00:00:00Z',
    status: 'PENDING',
    amountCalled: 100000,
    amountPaid: 0
  },
  {
    id: 'cc-2',
    fundId: 'fund-2',
    callNumber: 5,
    totalAmount: 18000000,
    purpose: 'New investment in AI healthcare platform',
    callDate: '2024-08-15T00:00:00Z',
    dueDate: '2024-09-30T00:00:00Z',
    status: 'PENDING',
    amountCalled: 72000,
    amountPaid: 0
  }
]

export const mockDistributions: Distribution[] = [
  {
    id: 'dist-1',
    fundId: 'fund-3',
    distributionNumber: 8,
    totalAmount: 45000000,
    distributionType: 'CAPITAL_GAIN',
    recordDate: '2024-08-01T00:00:00Z',
    paymentDate: '2024-08-15T00:00:00Z',
    description: 'Partial exit from office building portfolio',
    amount: 180000,
    taxWithholding: 36000,
    netAmount: 144000
  },
  {
    id: 'dist-2',
    fundId: 'fund-1',
    distributionNumber: 2,
    totalAmount: 12000000,
    distributionType: 'RETURN_OF_CAPITAL',
    recordDate: '2024-07-01T00:00:00Z',
    paymentDate: '2024-07-15T00:00:00Z',
    description: 'Dividend distribution from SaaS portfolio company',
    amount: 48000,
    taxWithholding: 0,
    netAmount: 48000
  }
]

export const mockCommunications: Communication[] = [
  {
    id: 'comm-1',
    fundId: 'fund-1',
    title: 'Q3 2024 Quarterly Update',
    content: 'Our Q3 performance exceeded expectations with strong growth in our SaaS portfolio companies...',
    type: 'NEWSLETTER',
    priority: 'NORMAL',
    targetAudience: 'INVESTORS',
    isGlobal: false,
    publishedAt: '2024-09-15T00:00:00Z',
    status: 'PUBLISHED',
    publishedBy: 'fund-manager-1'
  },
  {
    id: 'comm-2',
    title: 'Important: Updated Banking Instructions',
    content: 'Please note our updated wire transfer instructions for all future capital call payments...',
    type: 'ALERT',
    priority: 'HIGH',
    targetAudience: 'ALL',
    isGlobal: true,
    publishedAt: '2024-09-10T00:00:00Z',
    status: 'PUBLISHED',
    publishedBy: 'admin-1'
  }
]

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    fundId: 'fund-1',
    title: 'Tech Growth Fund III - Q2 2024 Quarterly Report',
    description: 'Comprehensive quarterly performance report including portfolio updates and financial statements',
    documentType: 'QUARTERLY_REPORT',
    fileName: 'TGF3_Q2_2024_Report.pdf',
    filePath: '/documents/funds/fund-1/quarterly/TGF3_Q2_2024_Report.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    version: '1.0',
    isConfidential: true,
    accessLevel: 'INVESTOR',
    uploadedBy: 'fund-manager-1',
    createdAt: '2024-07-30T00:00:00Z',
    updatedAt: '2024-07-30T00:00:00Z'
  },
  {
    id: 'doc-2',
    fundId: 'fund-2',
    title: 'Healthcare Innovation Fund II - Annual Financial Statements 2023',
    description: 'Audited annual financial statements for the year ended December 31, 2023',
    documentType: 'FINANCIAL_STATEMENT',
    fileName: 'HIF2_Annual_FS_2023.pdf',
    filePath: '/documents/funds/fund-2/annual/HIF2_Annual_FS_2023.pdf',
    fileSize: 1845632,
    mimeType: 'application/pdf',
    version: '1.0',
    isConfidential: true,
    accessLevel: 'INVESTOR',
    uploadedBy: 'fund-manager-2',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z'
  },
  {
    id: 'doc-3',
    capitalCallId: 'cc-1',
    title: 'Capital Call Notice #3 - Tech Growth Fund III',
    description: 'Notice for third capital call due October 15, 2024',
    documentType: 'CAPITAL_CALL_NOTICE',
    fileName: 'TGF3_Capital_Call_3.pdf',
    filePath: '/documents/capital-calls/cc-1/TGF3_Capital_Call_3.pdf',
    fileSize: 456123,
    mimeType: 'application/pdf',
    version: '1.0',
    isConfidential: false,
    accessLevel: 'INVESTOR',
    uploadedBy: 'fund-manager-1',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z'
  }
]

export const mockRecentActivities = [
  {
    id: 'activity-1',
    type: 'CAPITAL_CALL' as const,
    title: 'Capital Call Notice Received',
    description: 'Tech Growth Fund III - Call #3 due October 15, 2024',
    date: '2024-09-01T00:00:00Z',
    amount: 100000,
    status: 'PENDING',
    fundName: 'Tech Growth Fund III'
  },
  {
    id: 'activity-2',
    type: 'DOCUMENT' as const,
    title: 'Quarterly Report Available',
    description: 'Q2 2024 performance report now available for download',
    date: '2024-07-30T00:00:00Z',
    fundName: 'Tech Growth Fund III'
  },
  {
    id: 'activity-3',
    type: 'DISTRIBUTION' as const,
    title: 'Distribution Received',
    description: 'Real Estate Opportunity Fund IV - Distribution #8',
    date: '2024-08-15T00:00:00Z',
    amount: 144000,
    status: 'PAID',
    fundName: 'Real Estate Opportunity Fund IV'
  },
  {
    id: 'activity-4',
    type: 'COMMUNICATION' as const,
    title: 'Important Banking Update',
    description: 'Updated wire transfer instructions for capital calls',
    date: '2024-09-10T00:00:00Z'
  }
]

export const mockPendingActions = [
  {
    id: 'action-1',
    type: 'CAPITAL_CALL_DUE' as const,
    title: 'Capital Call Payment Due',
    description: 'Tech Growth Fund III - $100,000 due October 15, 2024',
    dueDate: '2024-10-15T00:00:00Z',
    priority: 'HIGH' as const
  },
  {
    id: 'action-2',
    type: 'CAPITAL_CALL_DUE' as const,
    title: 'Capital Call Payment Due',
    description: 'Healthcare Innovation Fund II - $72,000 due September 30, 2024',
    dueDate: '2024-09-30T00:00:00Z',
    priority: 'HIGH' as const
  },
  {
    id: 'action-3',
    type: 'DOCUMENT_REVIEW' as const,
    title: 'Review Q3 Reports',
    description: '3 quarterly reports pending your review',
    priority: 'NORMAL' as const
  }
]

// Mock API service that mimics the real API
export class MockInvestmentApiService {
  static async getInvestments() {
    await this.delay(500)
    return mockInvestments
  }

  static async getInvestmentSummary() {
    await this.delay(300)
    return mockInvestmentSummary
  }

  static async getUserFunds() {
    await this.delay(400)
    return mockFunds
  }

  static async getCapitalCalls() {
    await this.delay(350)
    return mockCapitalCalls
  }

  static async getDistributions() {
    await this.delay(350)
    return mockDistributions
  }

  static async getCommunications() {
    await this.delay(300)
    return mockCommunications
  }

  static async getDocuments() {
    await this.delay(400)
    return mockDocuments
  }

  static async getDashboardData() {
    await this.delay(600)
    return {
      summary: mockInvestmentSummary,
      recentActivities: mockRecentActivities,
      portfolioHoldings: mockInvestments,
      pendingActions: mockPendingActions
    }
  }

  private static delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}