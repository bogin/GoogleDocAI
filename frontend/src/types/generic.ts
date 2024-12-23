export interface Column {
  key: string
  label: string
  visible: boolean
  width?: string
  sortable?: boolean
  formatter?: (value: any, row: any) => string
}

export interface Row {
  id: string
  [key: string]: any
}
