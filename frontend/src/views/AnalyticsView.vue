<template>
  <div class="analytics-container">
    <div class="search-section">
      <h1 class="search-title">Ask anything about your files</h1>
      <p class="search-subtitle">
        Try "Who owns the most files?" or "Show files larger than 100MB"
      </p>
      <TextSearchFilter
        v-model="searchQuery"
        @search="handleSearch"
        placeholder="Ask a question about your files..."
      />
    </div>

    <!-- Results Section -->
    <div v-if="isLoading" class="results-loading">
      <div class="loading-spinner"></div>
      <p>Analyzing your files...</p>
    </div>

    <div v-else-if="error" class="results-error">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="hasResults" class="results-container">
      <div class="results-header">
        <h2>Results</h2>
        <p class="results-stats">
          Found {{ totalItems }} results ({{ queryTime }}ms)
        </p>
      </div>

      <!-- Dynamic Results Display -->
      <div class="results-content">
        <template v-if="Array.isArray(formattedResults)">
          <div
            v-for="(item, index) in formattedResults"
            :key="index"
            class="result-item"
          >
            <div class="result-title">{{ formatResultTitle(item) }}</div>
            <div class="result-details">
              <template
                v-for="(value, key) in formatResultDetails(item)"
                :key="key"
              >
                <div class="detail-item">
                  <span class="detail-label">{{ formatLabel(key) }}:</span>
                  <span class="detail-value">{{ value }}</span>
                </div>
              </template>
            </div>
          </div>
        </template>
        <div v-else class="result-summary">
          {{ formatSingleResult(formattedResults) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useStore } from 'vuex'
import TextSearchFilter from '../components/filters/TextFilter.vue'
import type { FormattedResult } from '@/types/analytics'

export default defineComponent({
  name: 'AnalyticsView',
  components: { TextSearchFilter },

  setup() {
    const store = useStore()
    const searchQuery = ref('')

    // Computed properties from store
    const isLoading = computed(() => store.state.analytics.isLoading)
    const error = computed(() => store.state.analytics.error)
    const hasResults = computed(() => store.getters['analytics/hasResults'])
    const formattedResults = computed(
      () => store.getters['analytics/formattedResults']
    )
    const totalItems = computed(() => store.state.analytics.totalItems)
    const queryTime = computed(() => store.state.analytics.queryTime)

    const handleSearch = async (query: string): Promise<void> => {
      if (!query.trim()) {
        store.dispatch('analytics/clearResults')
        return
      }

      try {
        await store.dispatch('analytics/analyzeFiles', query)
      } catch (error) {
        console.error('Search failed:', error)
      }
    }

    // Helper formatting functions
    const formatResultTitle = (item: FormattedResult): string => {
      if (item.name) return item.name
      if (item.owner?.displayName) return item.owner.displayName
      return 'Result'
    }

    const formatResultDetails = (
      item: FormattedResult
    ): Record<string, string | number> => {
      const details: Record<string, string | number> = {}
      if (item.fileCount) details.count = item.fileCount
      if (item.totalSize) details.size = item.formattedSize || '0 Bytes'
      if (item.modifiedTime) details.modified = item.formattedDate || ''
      return details
    }

    const formatLabel = (key: string): string => {
      return (
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      )
    }

    const formatSingleResult = (result: FormattedResult): string => {
      if (typeof result === 'object') {
        return JSON.stringify(result, null, 2)
      }
      return String(result)
    }

    return {
      searchQuery,
      isLoading,
      error,
      hasResults,
      formattedResults,
      totalItems,
      queryTime,
      handleSearch,
      formatResultTitle,
      formatResultDetails,
      formatLabel,
      formatSingleResult,
    }
  },
})
</script>

<style lang="scss" scoped>
.analytics-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.search-section {
  text-align: center;
  margin-bottom: 3rem;

  .search-title {
    font-size: 2rem;
    color: #202124;
    margin-bottom: 0.5rem;
  }

  .search-subtitle {
    color: #5f6368;
    margin-bottom: 2rem;
  }
}

.results-loading {
  text-align: center;
  padding: 2rem;

  .loading-spinner {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #1a73e8;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

.results-error {
  color: #d93025;
  text-align: center;
  padding: 1rem;
  background: #fce8e6;
  border-radius: 8px;
}

.results-container {
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ebebeb;

    .results-stats {
      color: #70757a;
      font-size: 0.875rem;
    }
  }

  .result-item {
    padding: 1rem;
    border-bottom: 1px solid #ebebeb;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f8f9fa;
    }

    .result-title {
      font-size: 1.125rem;
      color: #1a73e8;
      margin-bottom: 0.5rem;
    }

    .result-details {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;

      .detail-item {
        font-size: 0.875rem;
        color: #70757a;

        .detail-label {
          font-weight: 500;
          margin-right: 0.25rem;
        }
      }
    }
  }

  .result-summary {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: monospace;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
