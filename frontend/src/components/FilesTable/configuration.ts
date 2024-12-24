import { File, Permission } from '@/types/files'
import { Column } from '@/types/generic'

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

  const parts: string[] = []
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

    width: '200px',
  },
  {
    key: 'owner',
    label: 'Owner',
    visible: true,

    width: '150px',
    formatter: (_: any, file: File) =>
      getUsersByRole(file.permissions, 'owner'),
  },
  {
    key: 'access',
    label: 'Sharing',
    visible: false,

    width: '200px',
    formatter: (_: any, file: File) => getAccessSummary(file.permissions),
  },
  {
    key: 'anyoneAccess',
    label: 'Link Access',
    visible: true,

    width: '150px',
    formatter: (_: any, file: File) => getAnyoneAccess(file.permissions),
  },
  {
    key: 'commenters',
    label: 'Commenters',
    visible: true,

    width: '200px',
    formatter: (_: any, file: File) =>
      getUsersByRole(file.permissions, 'commenter'),
  },
  {
    key: 'modifiedTime',
    label: 'Modified',
    visible: true,

    width: '100px',
    formatter: formatDate,
  },
  {
    key: 'mimeType',
    label: 'Type',
    visible: true,
    width: '100px',
    formatter: (value: string) =>
      value.replaceAll('application/vnd.google-apps', '') || 'N/A',
  },
  {
    key: 'lastModifyingUser.displayName',
    label: 'Modified By',
    visible: true,

    width: '150px',
    formatter: (value: string) => value || 'N/A',
  },
  {
    key: 'size',
    label: 'Size',
    visible: true,

    width: '80px',
    formatter: formatSize,
  },
  {
    key: 'shared',
    label: 'Shared',
    visible: false,

    width: '100px',
    formatter: (value: boolean) => (value ? 'Yes' : 'No'),
  },
  {
    key: 'webViewLink',
    label: 'Link',
    visible: false,
    width: '80px',
    formatter: (value: string) => value || 'No link',
  },
  {
    key: 'actions',
    label: 'Actions',
    visible: true,
    width: '150px',
  },
]
