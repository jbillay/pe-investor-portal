export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SearchFilters {
  query?: string
  type?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface NavItem {
  label: string
  route: string
  icon?: string
  children?: NavItem[]
  requiresAuth?: boolean
  roles?: string[]
}