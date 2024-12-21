// src/store/modules/analytics.ts
import axios from 'axios'
import { Module, ActionContext } from 'vuex'
import {
  AnalyticsState,
  AnalyticsResult,
  FormattedResult,
} from '@/types/analytics'
import { RootState } from '@/types'

// Define the context type for our actions
type AnalyticsContext = ActionContext<AnalyticsState, RootState>

const state: AnalyticsState = {
  results: null,
  isLoading: false,
  error: null,
  totalItems: 0,
  queryTime: 0,
  lastQuery: '',
}

const mutations = {
  SET_LOADING(state: AnalyticsState, value: boolean) {
    state.isLoading = value
  },
  SET_RESULTS(state: AnalyticsState, results: any) {
    state.results = results
  },
  SET_ERROR(state: AnalyticsState, error: string | null) {
    state.error = error
  },
  SET_TOTAL_ITEMS(state: AnalyticsState, total: number) {
    state.totalItems = total
  },
  SET_QUERY_TIME(state: AnalyticsState, time: number) {
    state.queryTime = time
  },
  SET_LAST_QUERY(state: AnalyticsState, query: string) {
    state.lastQuery = query
  },
}

const actions = {
  async analyzeFiles(
    { commit }: AnalyticsContext,
    query: string
  ): Promise<AnalyticsResult> {
    const startTime = performance.now()
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    commit('SET_LAST_QUERY', query)

    try {
      const { data } = await axios.post<AnalyticsResult>('/analytics/analyze', {
        query,
      })
      commit('SET_RESULTS', data.result)
      commit(
        'SET_TOTAL_ITEMS',
        Array.isArray(data.result) ? data.result.length : 1
      )
      commit('SET_QUERY_TIME', Math.round(performance.now() - startTime))
      return data
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to analyze files'
      commit('SET_ERROR', errorMessage)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  clearResults({ commit }: AnalyticsContext): void {
    commit('SET_RESULTS', null)
    commit('SET_ERROR', null)
    commit('SET_TOTAL_ITEMS', 0)
    commit('SET_QUERY_TIME', 0)
    commit('SET_LAST_QUERY', '')
  },
}

const getters = {
  hasResults: (state: AnalyticsState): boolean => state.results !== null,
  formattedResults: (
    state: AnalyticsState
  ): FormattedResult[] | FormattedResult | null => {
    if (!state.results) return null

    if (Array.isArray(state.results)) {
      return state.results.map((item: any) => ({
        ...item,
        formattedSize: formatBytes(item.size),
        formattedDate: item.modifiedTime
          ? new Date(item.modifiedTime).toLocaleString()
          : null,
      }))
    }
    return state.results
  },
}

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const analyticsModule: Module<AnalyticsState, RootState> = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}

export default analyticsModule
