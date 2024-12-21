export interface File {
  id: string
  name: string
  size: number
  modifiedTime: string
  owner: { displayName: string }
}

export interface FilesState {
  items: File[]
  currentFile: File | null
  loading: boolean
  error: string | null
  pagination: {
    currentPage: 1
    pageSize: 10
    totalItems: 0
    totalPages: 0
    hasNextPage: false
  }
}
