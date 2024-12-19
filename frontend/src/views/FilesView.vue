<template>
  <div class="files-view">
    <!-- Header Section (remains the same) -->
    <div class="header">
      <div class="title-section">
        <h1>Files Management</h1>
        <p class="subtitle">Manage and organize your files</p>
      </div>
    </div>

    <!-- Filters Section (remains the same) -->
    <div class="filters-section">
      <div class="filters-container">
        <TextFilter v-model="filters.query" @search="applyFilters" />
        <DateFilter
          :model-value="filters.modifiedAfter"
          @update:model-value="updateDateFilter"
          placeholder="Modified After"
        />
        <button class="apply-filters-btn" @click="applyFilters">
          Apply Filters
        </button>
      </div>

      <div class="active-filters" v-if="hasActiveFilters">
        <div class="filter-tag" v-if="filters.query">
          Search: {{ filters.query }}
          <button @click="clearTextFilter" class="clear-filter">×</button>
        </div>
        <div class="filter-tag" v-if="filters.modifiedAfter">
          Modified after: {{ formatDate(filters.modifiedAfter) }}
          <button @click="clearDateFilter" class="clear-filter">×</button>
        </div>
      </div>
    </div>

    <!-- Files Table Section -->
    <div class="table-container" :class="{ loading }">
      <FilesTable
        :files="files"
        :loading="loading"
        @delete="handleDelete"
        @edit="handleEdit"
      />

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading files...</span>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && files.length === 0" class="empty-state">
        <span class="icon">📁</span>
        <p>No files found</p>
        <p class="subtitle" v-if="hasActiveFilters">
          Try clearing your filters
        </p>
      </div>
    </div>

    <!-- Pagination Section -->
    <AppPagination
      :pagination="pagination"
      :page-size="pageSize"
      @page-change="changePage"
      @size-change="handlePageSizeChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import TextFilter from '@/components/filters/TextFilter.vue'
import DateFilter from '@/components/filters/DateFilter.vue'
import FilesTable from '@/components/FilesTable.vue'
import AppPagination from '@/components/AppPagination.vue'

export default defineComponent({
  name: 'FilesView',
  components: { TextFilter, DateFilter, FilesTable, AppPagination },

  setup() {
    const store = useStore()
    const pageSize = ref(10)
    const currentPage = ref(1)
    const filters = ref({
      query: '',
      modifiedAfter: null as string | null,
    })

    // Computed properties
    const files = computed(() => store.state.files.items)
    const loading = computed(() => store.state.files.loading)
    const pagination = computed(() => store.state.files.pagination)

    const applyFilters = () => {
      currentPage.value = 1
      fetchFiles()
    }

    const updateTextFilter = (value: string) => {
      filters.value.query = value
    }

    const updateDateFilter = (value: string | null) => {
      filters.value.modifiedAfter = value
    }

    const clearTextFilter = () => {
      filters.value.query = ''
      applyFilters()
    }

    const clearDateFilter = () => {
      filters.value.modifiedAfter = null
      applyFilters()
    }

    const visiblePageNumbers = computed(() => {
      const current = pagination.value.currentPage
      const total = pagination.value.totalPages
      const delta = 2
      const left = current - delta
      const right = current + delta + 1
      const range = []
      const rangeWithDots = []
      let l

      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= left && i < right)) {
          range.push(i)
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1)
          } else if (i - l !== 1) {
            rangeWithDots.push('...')
          }
        }
        rangeWithDots.push(i)
        l = i
      }

      return rangeWithDots
    })

    const hasActiveFilters = computed(() =>
      Boolean(filters.value.query || filters.value.modifiedAfter)
    )

    // Methods
    const fetchFiles = () => {
      console.log('currentPage', currentPage.value)
      console.log('pagination', pagination.value)
      console.log('pageSize', pageSize.value)
      store.dispatch('files/fetchFiles', {
        page: currentPage.value,
        size: pageSize.value,
        filters: filters.value,
        pagination: pagination.value,
      })
    }

    const changePage = (page: number) => {
      if (page > 0 && page <= pagination.value.totalPages) {
        currentPage.value = page
        fetchFiles()
      }
    }

    const handlePageSizeChange = (value: number) => {
      pageSize.value = value
      fetchFiles()
    }

    const formatDate = (date: string | null) => {
      return date ? new Date(date).toLocaleDateString() : ''
    }

    const handleDelete = async (fileId: string) => {
      try {
        await store.dispatch('files/deleteFile', fileId)
        fetchFiles()
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    }

    const handleEdit = async ({
      fileId,
      data,
    }: {
      fileId: string
      data: Partial<File>
    }) => {
      try {
        await store.dispatch('files/updateFile', { fileId, data })
        fetchFiles()
      } catch (error) {
        console.error('Failed to update file:', error)
      }
    }

    const handleSearch = (query: string) => {
      updateTextFilter(query)
      fetchFiles() // Trigger the search
    }

    onMounted(fetchFiles)

    return {
      files,
      loading,
      pagination,
      filters,
      pageSize,
      currentPage,
      visiblePageNumbers,
      hasActiveFilters,
      updateTextFilter,
      handleSearch,
      updateDateFilter,
      handlePageSizeChange,
      clearTextFilter,
      clearDateFilter,
      formatDate,
      fetchFiles,
      changePage,
      handleDelete,
      handleEdit,
      applyFilters,
    }
  },
})
</script>

<style lang="scss" scoped>
.files-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  background: #f8f9fa;
  min-height: calc(100vh - 64px);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .title-section {
      h1 {
        font-size: 2rem;
        color: #1a202c;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .subtitle {
        color: #4a5568;
        font-size: 1rem;
      }
    }

    .sync-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      color: white;
      background: #4299e1;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #3182ce;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      &.loading .icon {
        animation: spin 1s linear infinite;
      }
    }
  }

  .filters-section {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;

    .filters-container {
      display: flex;
      gap: 1rem;
      align-items: center;

      .apply-filters-btn {
        height: 44px;
        padding: 0 24px;
        background: #1a73e8;
        color: white;
        border: none;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;

        &:hover {
          background: #1557b0;
        }

        &:active {
          background: #174ea6;
        }
      }
    }

    .active-filters {
      margin-top: 1rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      .filter-tag {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #ebf8ff;
        color: #2b6cb0;
        border-radius: 20px;
        font-size: 0.875rem;

        .clear-filter {
          background: none;
          border: none;
          color: #4a5568;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 50%;

          &:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #e53e3e;
          }
        }
      }
    }
  }

  .table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 40vh;
    max-height: 80vh;
    overflow: hidden;

    &.loading {
      opacity: 0.7;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 10;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #4299e1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #4a5568;

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
      }

      p {
        font-size: 1.125rem;
        margin: 0;

        &.subtitle {
          font-size: 0.875rem;
          color: #718096;
          margin-top: 0.5rem;
        }
      }
    }
  }

  .pagination-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .files-view {
    padding: 1rem;

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .filters-section .filters-container {
      flex-direction: column;
    }

    .pagination-section {
      flex-direction: column;
      gap: 1rem;
      text-align: center;

      .pagination-controls {
        order: -1;
      }
    }
  }
}
</style>
