export interface Fund {
  id: string
  name: string
  description?: string
  fundType: 'PE' | 'VC' | 'GROWTH' | 'REAL_ESTATE' | 'INFRASTRUCTURE' | 'DEBT'
  vintage: number
  targetSize: number
  commitedSize: number
  drawnSize: number
  currency: string
  status: 'ACTIVE' | 'CLOSED' | 'LIQUIDATED'
  closeDate?: string
  finalClose?: string
  liquidationDate?: string
  managementFee?: number
  carriedInterest?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Investment {
  id: string
  userId: string
  fundId: string
  commitmentAmount: number
  drawnAmount: number
  distributedAmount: number
  currentValue: number
  irr?: number
  multiple?: number
  status: 'ACTIVE' | 'EXITED' | 'DEFAULTED'
  investmentDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  fund?: {
    id: string
    name: string
    fundType: string
    vintage: number
    currency: string
    status: string
  }
}

export interface InvestmentSummary {
  totalInvestments: number
  totalCommitted: number
  totalDrawn: number
  totalDistributed: number
  totalCurrentValue: number
  overallIrr: number
  overallMultiple: number
  unfundedCommitment: number
}

export interface CapitalCall {
  id: string
  fundId: string
  callNumber: number
  totalAmount: number
  purpose: string
  callDate: string
  dueDate: string
  settlementDate?: string
  status: 'PENDING' | 'FUNDED' | 'OVERDUE' | 'CANCELLED'
  amountCalled?: number
  amountPaid?: number
  paymentDate?: string
}

export interface Distribution {
  id: string
  fundId: string
  distributionNumber: number
  totalAmount: number
  distributionType: 'RETURN_OF_CAPITAL' | 'CAPITAL_GAIN' | 'INCOME'
  recordDate: string
  paymentDate: string
  description?: string
  amount?: number
  taxWithholding?: number
  netAmount?: number
}

export interface Valuation {
  id: string
  fundId: string
  valuationDate: string
  totalValue: number
  sharePrice?: number
  irr?: number
  multiple?: number
  unrealizedValue?: number
  realizedValue?: number
  totalCommitted?: number
  totalDrawn?: number
  totalDistributed?: number
  benchmark?: string
  benchmarkReturn?: number
  notes?: string
}

export interface Communication {
  id: string
  fundId?: string
  title: string
  content: string
  type: 'ANNOUNCEMENT' | 'ALERT' | 'NEWSLETTER'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  targetAudience: 'ALL' | 'INVESTORS' | 'ADMINS' | 'SPECIFIC'
  isGlobal: boolean
  publishedAt?: string
  expiresAt?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedBy: string
}

export interface Document {
  id: string
  fundId?: string
  capitalCallId?: string
  distributionId?: string
  title: string
  description?: string
  documentType: 'FINANCIAL_STATEMENT' | 'TAX_FORM' | 'LEGAL_AGREEMENT' | 'QUARTERLY_REPORT' | 'ANNUAL_REPORT' | 'CAPITAL_CALL_NOTICE' | 'DISTRIBUTION_NOTICE'
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  version: string
  isConfidential: boolean
  accessLevel: 'PUBLIC' | 'INVESTOR' | 'ADMIN'
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercentage: number
  irr: number
  multiple: number
  unrealizedGain: number
  realizedGain: number
}