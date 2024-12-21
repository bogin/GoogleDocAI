export interface FormFieldOption {
  label: string
  value: any
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: FormFieldOption[]
  min?: number
  max?: number
  validator?: (value: any) => string | null
}

export interface FormErrors {
  [key: string]: string
}
