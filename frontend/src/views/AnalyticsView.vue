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

        <AppInput
          type="text"
          name="searchResults"
          v-model="searchInResults"
          placeholder="Search in results..."
          class="results-search"
        />
      </div>

      <!-- Results Display -->
      <div class="results-content">
        <template v-if="Array.isArray(filteredResults)">
          <div
            v-for="(item, index) in filteredResults"
            :key="index"
            class="result-item"
            :class="{ highlight: isHighlighted(item) }"
          >
            <div class="result-header" @click="toggleExpand(index)">
              <span class="expand-icon">{{
                expandedItems[index] ? '▼' : '▶'
              }}</span>
              <div class="result-title">{{ formatResultTitle(item) }}</div>
            </div>
            <div v-show="expandedItems[index]" class="result-details">
              <div v-for="(value, key) in item" :key="key" class="detail-row">
                <span class="detail-key">{{ formatKey(`${key}`) }}:</span>
                <span class="detail-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="single-result">
          <div
            v-for="(value, key) in formattedResults"
            :key="key"
            class="detail-row"
          >
            <span class="detail-key">{{ formatKey(`${key}`) }}:</span>
            <span class="detail-value">{{ formatValue(value) }}</span>
          </div>
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
import AppInput from '@/components/AppInput.vue'

export default defineComponent({
  name: 'AnalyticsView',
  components: { TextSearchFilter, AppInput },

  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const searchInResults = ref('')
    const expandedItems = ref<Record<number, boolean>>({})

    const isLoading = computed(() => store.state.analytics.isLoading)
    const error = computed(() => store.state.analytics.error)
    const hasResults = computed(() => store.getters['analytics/hasResults'])
    const formattedResults = computed(
      () => store.getters['analytics/formattedResults']
    )
    const totalItems = computed(() => store.state.analytics.totalItems)
    const queryTime = computed(() => store.state.analytics.queryTime)

    const filteredResults = computed(() => {
      if (!searchInResults.value || !Array.isArray(formattedResults.value)) {
        return formattedResults.value
      }

      const searchTerm = searchInResults.value.toLowerCase()
      return formattedResults.value.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchTerm)
      )
    })

    const handleSearch = async (query: string): Promise<void> => {
      if (!query.trim()) {
        store.dispatch('analytics/clearResults')
        return
      }

      try {
        await store.dispatch('analytics/analyzeFiles', query)
      } catch (error) {
        console.error('Search failed:')
      }
    }

    const toggleExpand = (index: number) => {
      expandedItems.value[index] = !expandedItems.value[index]
    }

    const formatResultTitle = (item: FormattedResult): string => {
      if (item.name) return item.name
      if (item.owner?.displayName) return item.owner.displayName
      return 'Result'
    }

    const formatKey = (key: string): string => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
    }

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '-'
      if (typeof value === 'object') return JSON.stringify(value, null, 2)
      return String(value)
    }

    const isHighlighted = (item: FormattedResult): boolean => {
      if (!searchInResults.value) return false
      return JSON.stringify(item)
        .toLowerCase()
        .includes(searchInResults.value.toLowerCase())
    }

    return {
      searchQuery,
      searchInResults,
      expandedItems,
      isLoading,
      error,
      hasResults,
      formattedResults,
      filteredResults,
      totalItems,
      queryTime,
      handleSearch,
      toggleExpand,
      formatResultTitle,
      formatKey,
      formatValue,
      isHighlighted,
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
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ebebeb;

    .results-stats {
      color: #70757a;
      font-size: 0.875rem;
      margin: 0.5rem 0;
    }

    .results-search {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ebebeb;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-top: 0.5rem;

      &:focus {
        outline: none !important;
        border-color: #1a73e8;
      }
    }
  }
}

.result-item {
  border: 1px solid #ebebeb;
  border-radius: 4px;
  margin-bottom: 0.5rem;

  &.highlight {
    background-color: #fff3e0;
  }

  .result-header {
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
      background-color: #f8f9fa;
    }

    .expand-icon {
      margin-right: 0.5rem;
      font-size: 0.75rem;
      color: #5f6368;
    }

    .result-title {
      font-weight: 500;
      color: #1a73e8;
    }
  }

  .result-details {
    padding: 0.75rem;
    border-top: 1px solid #ebebeb;
    background-color: #f8f9fa;
  }
}

.detail-row {
  display: flex;
  padding: 0.25rem 0;
  font-size: 0.875rem;

  .detail-key {
    color: #5f6368;
    min-width: 120px;
    font-weight: 500;
  }

  .detail-value {
    color: #202124;
    word-break: break-word;
    white-space: pre-wrap;
    font-family: monospace;
  }
}

.single-result {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ebebeb;
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
