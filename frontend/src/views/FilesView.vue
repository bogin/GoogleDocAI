<template>
  <div class="files-view">
    <div class="header">
      <div class="title-section">
        <h1>Files Management</h1>
      </div>
    </div>

    <FiltersContainer v-model="filters" @apply="applyFilters" />

    <div v-if="error" class="error-container">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{{ error }}</p>
        <AppButton variant="primary" @click="retryFetch">Try Again</AppButton>
      </div>
    </div>

    <div v-else class="files-containerr" :class="{ loading }">
      <FilesTable
        :files="files"
        :loading="loading"
        @delete="handleDelete"
        @update="handleEdit"
      />

      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading files...</span>
      </div>

      <div v-if="!loading && files.length === 0" class="empty-state">
        <span class="icon">📁</span>
        <p>No files found</p>
        <p class="subtitle" v-if="hasActiveFilters">
          Try clearing your filters
        </p>
      </div>
    </div>

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
import FilesTable from '../components/FilesTable/FilesTable.vue'
import TablePagination from '../components/Table/TablePagination.vue'
import AppButton from '../components/AppButton.vue'
import FiltersContainer from '../components/filters/FiltersContainer.vue'

export default defineComponent({
  name: 'FilesView',
  components: {
    AppButton,
    FilesTable,
    TablePagination,
    FiltersContainer,
  },

  setup() {
    const store = useStore()
    const pageSize = ref(10)
    const currentPage = ref(1)
    const filters = ref<{ query: string; modifiedTime?: string }>({
      query: '',
      modifiedTime: undefined,
    })

    const files = computed(() => store.state.files.items)
    const loading = computed(() => store.state.files.loading)
    const error = computed(() => store.state.files.error)
    const pagination = computed(() => store.state.files.pagination)
    const hasActiveFilters = computed(() =>
      Boolean(filters.value.query || filters.value.modifiedTime)
    )

    const fetchFiles = () => {
      store.dispatch('files/fetchFiles', {
        page: currentPage.value,
        size: pageSize.value,
        filters: filters.value,
        pagination: pagination.value,
      })
    }

    const applyFilters = () => {
      currentPage.value = 1
      fetchFiles()
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
      pagination.value.pageSize = value
      fetchFiles()
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
      hasActiveFilters,
      handlePageSizeChange,
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
  min-height: calc(93vh - 64px);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

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
  }

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
    }
  }

  .files-containerr {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    min-height: 40vh;
    max-height: 62vh;
    overflow: hidden;
    padding: 14px;

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

    .files-containerr {
      margin-top: 1rem;
    }
  }
}
</style>
