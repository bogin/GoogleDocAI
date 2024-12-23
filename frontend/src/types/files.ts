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

export interface Permission {
  id: string
  kind: string
  role: 'owner' | 'commenter' | 'reader' | 'writer'
  type: 'user' | 'anyone' | 'group' | 'domain'
  deleted?: boolean
  photoLink?: string
  displayName?: string
  emailAddress?: string
  pendingOwner?: boolean
  allowFileDiscovery?: boolean
}

export interface File {
  id: string
  name: string
  mimeType: string
  iconLink?: string
  webViewLink?: string
  size: string | number
  shared: boolean
  trashed: boolean
  createdTime: string | null
  modifiedTime: string
  version: string
  capabilities: {
    canEdit: boolean
    canShare: boolean
    canDelete: boolean
    [key: string]: boolean
  }
  lastModifyingUser?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }
  owners?: {
    displayName: string
    emailAddress: string
    photoLink?: string
  }[]
  permissions: Permission[]
}

export interface FileUpdatePayload {
  fileId: string
  data: Partial<File>
}
