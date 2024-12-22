import { createStore } from 'vuex'
import files from './modules/files'
import { RootState } from '@/types'
import analytics from './modules/analytics'
import systemSettings from './modules/systemSettings'

export default createStore<RootState>({
  modules: {
    files,
    analytics,
    systemSettings,
  },
})
