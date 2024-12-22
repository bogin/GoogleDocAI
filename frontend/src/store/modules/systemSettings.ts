import { Module, ActionContext } from 'vuex'
import axios, { AxiosError } from 'axios'
import {
  SystemSettingsState,
  SystemSetting,
  OpenAISettings,
  GoogleSettings,
  RootState,
} from '../../types/systemSettings'

// Define payload interfaces
interface UpdateSettingPayload {
  key: any
  value: OpenAISettings | GoogleSettings
}

interface BatchUpdatePayload {
  settings: Array<{
    key: any
    value: OpenAISettings | GoogleSettings
  }>
}

type SystemSettingsContext = ActionContext<SystemSettingsState, RootState>

const state: SystemSettingsState = {
  settings: null,
  isLoading: false,
  error: null,
}

const mutations = {
  SET_LOADING(state: SystemSettingsState, value: boolean): void {
    state.isLoading = value
  },

  SET_SETTINGS(state: SystemSettingsState, settings: SystemSetting[]): void {
    state.settings = settings
  },

  SET_ERROR(state: SystemSettingsState, error: string | null): void {
    state.error = error
  },

  UPDATE_SETTING(state: SystemSettingsState, setting: SystemSetting): void {
    if (state.settings) {
      const index = state.settings.findIndex((s) => s.key === setting.key)
      if (index !== -1) {
        state.settings[index] = setting
      }
    }
  },
}

const actions = {
  async fetchSettings({
    commit,
  }: SystemSettingsContext): Promise<SystemSetting[]> {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const { data } = await axios.get<SystemSetting[]>('/system-settings')
      commit('SET_SETTINGS', data)
      return data
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || 'Failed to fetch settings'
          : 'An unexpected error occurred'
      commit('SET_ERROR', errorMessage)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateSetting(
    { commit }: SystemSettingsContext,
    payload: UpdateSettingPayload
  ): Promise<SystemSetting> {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const { data } = await axios.put<SystemSetting>(
        `/system-settings/${payload.key}`,
        { value: payload.value }
      )
      commit('UPDATE_SETTING', data)
      return data
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || 'Failed to update setting'
          : 'An unexpected error occurred'
      commit('SET_ERROR', errorMessage)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateBatch(
    { commit }: SystemSettingsContext,
    payload: BatchUpdatePayload
  ): Promise<SystemSetting[]> {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const { data } = await axios.put<SystemSetting[]>('/system-settings', {
        settings: payload.settings,
      })
      commit('SET_SETTINGS', data)
      return data
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.error || 'Failed to update settings'
          : 'An unexpected error occurred'
      commit('SET_ERROR', errorMessage)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },
}

const getters = {
  getSettingByKey:
    (state: SystemSettingsState) =>
    (key: any): SystemSetting | undefined => {
      return state.settings?.find((setting) => setting.key === key)
    },

  getOpenAISettings: (state: SystemSettingsState): OpenAISettings | null => {
    return (
      (state.settings?.find((s) => s.key === 'openai')
        ?.value as OpenAISettings) || null
    )
  },

  getGoogleSettings: (state: SystemSettingsState): GoogleSettings | null => {
    return (
      (state.settings?.find((s) => s.key === 'google')
        ?.value as GoogleSettings) || null
    )
  },
}

const systemSettingsModule: Module<SystemSettingsState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}

export default systemSettingsModule
