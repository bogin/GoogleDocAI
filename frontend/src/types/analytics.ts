export interface AnalyticsState {
  results: any | null
  isLoading: boolean
  error: string | null
  totalItems: number
  queryTime: number
  lastQuery: string
}

export interface AnalyticsResult {
  success: boolean
  query: string
  result: any
  metadata: {
    timestamp: string
  }
}

export interface FormattedResult {
  name?: string
  fileCount?: number
  totalSize?: number
  formattedSize?: string
  modifiedTime?: string
  formattedDate?: string
  owner?: {
    displayName: string
    emailAddress: string
  }
}
