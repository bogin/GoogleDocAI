import { Column, File, Permission } from '@/types/files'

const formatDate = (date: string | null) => {
  return date ? new Date(date).toLocaleString() : 'N/A'
}

const formatSize = (bytes: string | number) => {
  if (!bytes) return 'N/A'
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (num === 0) return '0 Byte'
  const i = Math.floor(Math.log(num) / Math.log(1024))
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const getUsersByRole = (
  permissions: Permission[] | undefined,
  role: Permission['role']
) => {
  if (!permissions) return 'N/A'
  const users = permissions.filter((p) => p.role === role && p.type === 'user')
  return users.length > 0
    ? users.map((u) => u.displayName || u.emailAddress).join(', ')
    : 'None'
}

const getAnyoneAccess = (permissions: Permission[] | undefined) => {
  if (!permissions) return 'None'
  const anyonePermission = permissions.find((p) => p.type === 'anyone')
  if (!anyonePermission) return 'None'

  const roleMap = {
    owner: 'Full Access',
    writer: 'Can Edit',
    commenter: 'Can Comment',
    reader: 'Can View',
  }

  return `${roleMap[anyonePermission.role]}${
    !anyonePermission.allowFileDiscovery ? ' (Link Required)' : ''
  }`
}

const getAccessSummary = (permissions: Permission[] | undefined) => {
  if (!permissions) return 'Private'

  const types = permissions.reduce((acc, p) => {
    if (!acc[p.type]) acc[p.type] = []
    acc[p.type].push(p.role)
    return acc
  }, {} as Record<string, string[]>)

  const parts = []
  if (types.anyone) parts.push('Anyone')
  if (types.domain) parts.push('Domain')
  if (types.group) parts.push('Groups')
  if (types.user && types.user.length > 1)
    parts.push(`${types.user.length} Users`)

  return parts.length ? parts.join(', ') : 'Private'
}

export const defaultColumns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    visible: true,
    sortable: true,
    width: '250px',
  },
  {
    key: 'owner',
    label: 'Owner',
    visible: true,
    sortable: true,
    width: '150px',
    formatter: (_, file) => getUsersByRole(file.permissions, 'owner'),
  },
  {
    key: 'access',
    label: 'Sharing',
    visible: true,
    sortable: false,
    width: '200px',
    formatter: (_, file) => getAccessSummary(file.permissions),
  },
  {
    key: 'anyoneAccess',
    label: 'Link Access',
    visible: true,
    sortable: false,
    width: '150px',
    formatter: (_, file) => getAnyoneAccess(file.permissions),
  },
  {
    key: 'commenters',
    label: 'Commenters',
    visible: true,
    sortable: false,
    width: '200px',
    formatter: (_, file) => getUsersByRole(file.permissions, 'commenter'),
  },
  {
    key: 'modifiedTime',
    label: 'Modified',
    visible: true,
    sortable: true,
    width: '160px',
    formatter: formatDate,
  },
  {
    key: 'lastModifyingUser.displayName',
    label: 'Modified By',
    visible: true,
    sortable: true,
    width: '150px',
    formatter: (value) => value || 'N/A',
  },
  {
    key: 'size',
    label: 'Size',
    visible: true,
    sortable: true,
    width: '100px',
    formatter: formatSize,
  },
  {
    key: 'mimeType',
    label: 'Type',
    visible: true,
    sortable: true,
    width: '150px',
  },
  {
    key: 'shared',
    label: 'Shared',
    visible: false, // Hidden by default since we have better sharing columns now
    sortable: true,
    width: '100px',
    formatter: (value: boolean) => (value ? 'Yes' : 'No'),
  },
  {
    key: 'actions',
    label: 'Actions',
    visible: true,
    width: '100px',
  },
]
