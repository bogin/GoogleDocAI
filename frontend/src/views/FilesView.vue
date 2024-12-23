<template>
  <div class="files-view">
    <!-- Header Section -->
    <div class="header">
      <div class="title-section">
        <h1>Files Management</h1>
        <p class="subtitle">Manage and organize your files</p>
      </div>
    </div>

    <!-- Filters Section -->
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

    <!-- Error State -->
    <div v-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{{ error }}</p>
        <button @click="retryFetch" class="retry-button">Try Again</button>
      </div>
    </div>

    <!-- Files Table Section -->
    <div v-else class="table-container" :class="{ loading }">
      <FilesTable
        :files="files"
        :loading="loading"
        @delete="handleDelete"
        @update="handleEdit"
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
    <TablePagination
      v-if="!error"
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
import FilesTable from '../components/FilesTable/FilesTable.vue'
import TablePagination from '../components/Table/TablePagination.vue'

export default defineComponent({
  name: 'FilesView',
  components: { TextFilter, DateFilter, FilesTable, TablePagination },

  setup() {
    const store = useStore()
    const pageSize = ref(10)
    const currentPage = ref(1)
    const filters = ref({
      query: '',
      modifiedAfter: null as string | null,
    })

    const files = computed(() => store.state.files.items)
    const loading = computed(() => store.state.files.loading)
    const error = computed(() => store.state.files.error)
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

    const hasActiveFilters = computed(() =>
      Boolean(filters.value.query || filters.value.modifiedAfter)
    )

    const fetchFiles = () => {
      store.dispatch('files/fetchFiles', {
        page: currentPage.value,
        size: pageSize.value,
        filters: filters.value,
        pagination: pagination.value,
      })
    }

    const retryFetch = () => {
      store.commit('files/SET_ERROR', null)
      fetchFiles()
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

    onMounted(fetchFiles)

    return {
      files,
      loading,
      error,
      pagination,
      filters,
      pageSize,
      currentPage,
      hasActiveFilters,
      updateTextFilter,
      updateDateFilter,
      handlePageSizeChange,
      clearTextFilter,
      clearDateFilter,
      formatDate,
      fetchFiles,
      retryFetch,
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
  margin: 0 auto;
  padding: 0 2rem;
  background: #f8f9fa;
  min-height: calc(100vh - 64px);

  .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .error-content {
      text-align: center;
      max-width: 500px;

      .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      h2 {
        color: #e53e3e;
        margin-bottom: 0.5rem;
      }

      p {
        color: #4a5568;
        margin-bottom: 1.5rem;
      }

      .retry-button {
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: #1d4ed8;
        }
      }
    }
  }

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
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;

    .filters-container {
      display: grid;
      grid-template-columns: minmax(300px, 1fr) 200px auto;
      gap: 1rem;
      padding: 1rem;
      align-items: center;

      :deep(.text-filter) {
        .search-input {
          width: 100%;
          height: 42px;
          padding: 0 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9375rem;
          background: #f8fafc;
          transition: all 0.2s ease;

          &:hover {
            border-color: #cbd5e1;
            background: white;
          }

          &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: white;
          }

          &::placeholder {
            color: #94a3b8;
          }
        }
      }

      :deep(.date-filter) {
        input {
          width: 100%;
          height: 42px;
          padding: 0 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9375rem;
          color: #475569;
          background: #f8fafc;

          &:hover {
            border-color: #cbd5e1;
            background: white;
          }

          &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: white;
          }
        }
      }

      .apply-filters-btn {
        height: 42px;
        padding: 0 1.5rem;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;

        &:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .active-filters {
      padding: 0.75rem 1rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      border-top: 1px solid #f1f5f9;

      .filter-tag {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.75rem;
        background: #f1f5f9;
        color: #475569;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 500;

        .clear-filter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          margin-left: 0.25rem;
          border: none;
          background: none;
          color: #64748b;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s ease;

          &:hover {
            background: #e2e8f0;
            color: #dc2626;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .filters-section {
    padding: 1rem;

    .filters-container {
      flex-direction: column;
      gap: 1rem;

      :deep(.text-filter),
      :deep(.date-filter) {
        width: 100%;
      }

      .apply-filters-btn {
        width: 100%;
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
