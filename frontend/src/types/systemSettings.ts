export interface SystemSetting {
  key: string
  value: any
  updated_at: string
}

export interface SystemSettingsState {
  settings: SystemSetting[] | null
  isLoading: boolean
  error: string | null
}

export interface OpenAISettings {
  typoKey: string
  analyticsKey: string
  mongoFilesKey: string
  postgresFilesKey: string
}

export interface GoogleSettings {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface RootState {
  systemSettings: SystemSettingsState
}
