<template>
  <div class="files-table-wrapper">
    <div class="table-header">
      <ColumnVisibilityToggle
        :columns="columns"
        @update:columns="updateColumns"
      />
    </div>

    <div class="table-container" v-if="files.length">
      <div class="table-scroll-container">
        <table class="files-table">
          <thead>
            <tr>
              <th
                v-for="column in visibleColumns"
                :key="column.key"
                :style="{ width: column.width }"
                :class="{ sortable: column.sortable }"
                @click="column.sortable ? handleSort(column.key) : null"
              >
                {{ column.label }}
                <span
                  v-if="column.sortable"
                  class="sort-indicator"
                  :class="getSortIndicatorClass(column.key)"
                >
                  ↕
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file.id">
              <td
                v-for="column in visibleColumns"
                :key="column.key"
                :style="{ width: column.width }"
              >
                <template v-if="column.key === 'actions'">
                  <div class="actions">
                    <button
                      v-if="file.webViewLink"
                      class="btn btn-copy"
                      @click="copyLink(file.webViewLink)"
                      title="Copy Link"
                    >
                      📋
                    </button>
                    <button
                      class="btn btn-edit"
                      @click="handleEdit(file)"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      class="btn btn-delete"
                      @click="handleDelete(file.id)"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </template>
                <template v-else>
                  <span :title="formatValue(file, column)">
                    {{ formatValue(file, column) }}
                  </span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this file?</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="btn btn-danger">Delete</button>
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <AppToast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <!-- Dynamic Form for Edit -->
    <DynamicForm
      v-if="showForm"
      :show="showForm"
      title="File"
      :form-config="formConfig"
      :initial-data="editingFile"
      @update="handleFormSubmit"
      @close="showForm = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue'
import { File, Column } from '@/types/files'
import { defaultColumns } from './configuration'
import ColumnVisibilityToggle from './ColumnVisibilityToggle.vue'
import AppToast from '../Toast.vue'
import DynamicForm from '../DynamicForm.vue'
import { FormField } from '@/types/formField'

const formConfig: FormField[] = [
  {
    name: 'name',
    label: 'File Name',
    type: 'text',
    required: true,
    placeholder: 'Enter file name',
  },
  {
    name: 'shared',
    label: 'Shared',
    type: 'checkbox',
  },
  {
    name: 'mimeType',
    label: 'File Type',
    type: 'select',
    options: [
      { label: 'Document', value: 'application/vnd.google-apps.document' },
      {
        label: 'Spreadsheet',
        value: 'application/vnd.google-apps.spreadsheet',
      },
      {
        label: 'Presentation',
        value: 'application/vnd.google-apps.presentation',
      },
    ],
    required: true,
  },
]

export default defineComponent({
  name: 'FilesTable',

  components: {
    ColumnVisibilityToggle,
    AppToast,
    DynamicForm,
  },

  props: {
    files: {
      type: Array as PropType<File[]>,
      required: true,
    },
  },

  emits: ['delete', 'update'],

  setup(props, { emit }) {
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')
    const showDeleteModal = ref(false)
    const showForm = ref(false)
    const editingFile = ref<Partial<File> | null>(null)
    const deletingFileId = ref<string | null>(null)
    const columns = ref<Column[]>(defaultColumns)
    const sortConfig = ref({
      key: null as string | null,
      direction: 'asc' as 'asc' | 'desc',
    })

    const visibleColumns = computed(() => {
      return columns.value.filter((column) => column.visible)
    })

    const updateColumns = (newColumns: Column[]) => {
      columns.value = newColumns
    }

    const handleSort = (key: string) => {
      if (sortConfig.value.key === key) {
        sortConfig.value.direction =
          sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
      } else {
        sortConfig.value.key = key
        sortConfig.value.direction = 'asc'
      }
    }

    const getSortIndicatorClass = (key: string) => {
      if (sortConfig.value.key !== key) return ''
      return sortConfig.value.direction === 'asc' ? 'asc' : 'desc'
    }

    const formatValue = (file: File, column: Column) => {
      if (column.key === 'actions') return ''

      const value = column.key.includes('.')
        ? column.key.split('.').reduce((obj: any, key) => obj?.[key], file)
        : (file as any)[column.key]

      return column.formatter ? column.formatter(value, file) : value
    }

    const handleDelete = (fileId: string) => {
      deletingFileId.value = fileId
      showDeleteModal.value = true
    }

    const confirmDelete = () => {
      if (deletingFileId.value) {
        emit('delete', deletingFileId.value)
      }
      showDeleteModal.value = false
      deletingFileId.value = null
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      deletingFileId.value = null
    }

    const copyLink = async (link: string) => {
      try {
        await navigator.clipboard.writeText(link)
        toastMessage.value = 'Link copied to clipboard!'
        toastType.value = 'success'
        showToast.value = true
      } catch (err) {
        toastMessage.value = 'Failed to copy link'
        toastType.value = 'error'
        showToast.value = true
        console.error('Failed to copy link:', err)
      }
    }

    const handleEdit = (file: File) => {
      editingFile.value = { ...file }
      showForm.value = true
    }

    const handleFormSubmit = async (formData: Partial<File>) => {
      if (editingFile.value?.id) {
        await emit('update', {
          fileId: editingFile.value.id,
          data: formData,
        })
      }
      showForm.value = false
      editingFile.value = null
    }

    return {
      showToast,
      toastMessage,
      toastType,
      showDeleteModal,
      editingFile,
      columns,
      visibleColumns,
      showForm,
      formConfig,
      handleEdit,
      handleFormSubmit,
      copyLink,
      handleDelete,
      confirmDelete,
      cancelDelete,
      updateColumns,
      handleSort,
      getSortIndicatorClass,
      formatValue,
    }
  },
})
</script>

<style lang="scss" scoped>
.files-table-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.table-container {
  position: relative;
  height: 100%;
  min-height: 400px;
  max-height: calc(86vh - 300px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-scroll-container {
  height: 100%;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.files-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f8f9fa;

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
      position: relative;

      &.sortable {
        cursor: pointer;
        user-select: none;

        &:hover {
          background: #edf2f7;
        }
      }

      .sort-indicator {
        margin-left: 4px;
        opacity: 0.5;

        &.asc {
          opacity: 1;
          transform: rotate(180deg);
        }

        &.desc {
          opacity: 1;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f7fafc;
      }

      td {
        padding: 12px;
        text-align: left;
        color: #2d3748;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;

  .btn {
    padding: 6px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &.btn-copy {
      &:hover {
        background: #e6fffb;
        color: #13c2c2;
      }
    }

    &.btn-edit {
      &:hover {
        background: #e6f7ff;
        color: #1890ff;
      }
    }

    &.btn-delete {
      &:hover {
        background: #fff1f0;
        color: #f5222d;
      }
    }
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    min-width: 400px;
    max-width: 90vw;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px 0;
      color: #2d3748;
    }

    .form-group {
      margin: 20px 0;

      label {
        display: block;
        margin-bottom: 8px;
        color: #4a5568;
        font-weight: 500;
      }

      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #2196f3;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        &-primary {
          background: #2196f3;
          color: white;

          &:hover {
            background: #1976d2;
          }
        }

        &-secondary {
          background: #e2e8f0;
          color: #4a5568;

          &:hover {
            background: #cbd5e0;
          }
        }

        &-danger {
          background: #f44336;
          color: white;

          &:hover {
            background: #d32f2f;
          }
        }
      }
    }
  }
}

// Responsive styles
@media (max-width: 768px) {
  .files-table {
    th,
    td {
      &:not(:first-child):not(:last-child) {
        display: none;
      }
    }
  }

  .modal .modal-content {
    min-width: unset;
    width: 90%;
    margin: 20px;
  }
}
</style>
