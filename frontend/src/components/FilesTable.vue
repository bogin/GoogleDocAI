<template>
  <div class="files-table-wrapper">
    <div class="table-container">
      <table class="files-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Modified</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
      </table>
      <div class="table-body-container">
        <table class="files-table">
          <tbody>
            <tr v-for="file in files" :key="file.id">
              <td>
                <div class="file-name" @click="handleView(file.id)">
                  <el-tooltip :content="file.name" placement="top">
                    <span>{{ truncatedFileName(file.name) }}</span>
                  </el-tooltip>
                </div>
              </td>
              <td>{{ file.owner || 'Unknown' }}</td>
              <td>{{ formatDate(file.modifiedTime) }}</td>
              <td>{{ formatSize(file.size) }}</td>
              <td class="actions">
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
                <button
                  class="btn btn-view"
                  @click="handleView(file.id)"
                  title="View Details"
                >
                  👁️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>Edit File</h3>
        <div class="form-group">
          <label>Name:</label>
          <input v-model="editingFile.name" type="text" />
        </div>
        <div class="modal-actions">
          <button @click="saveEdit" class="btn btn-primary">Save</button>
          <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
        </div>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from 'vue'
import { useRouter } from 'vue-router'
import { File } from '@/types/files'

export default defineComponent({
  name: 'FilesTable',

  props: {
    files: {
      type: Array as PropType<File[]>,
      required: true,
    },
  },

  emits: ['delete', 'update'],

  setup(props, { emit }) {
    const router = useRouter()
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const editingFile = ref<Partial<File>>({})
    const deletingFileId = ref<string | null>(null)

    const formatDate = (date: string): string => {
      return new Date(date).toLocaleString()
    }

    const formatSize = (bytes: number): string => {
      if (!bytes) return 'N/A'
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
    }

    const handleEdit = (file: File) => {
      editingFile.value = { ...file }
      showEditModal.value = true
    }

    const handleDelete = (fileId: string) => {
      deletingFileId.value = fileId
      showDeleteModal.value = true
    }

    const handleView = (fileId: string) => {
      router.push(`/files/${fileId}`)
    }

    const saveEdit = () => {
      if (editingFile.value.id) {
        emit('update', {
          fileId: editingFile.value.id,
          data: editingFile.value,
        })
      }
      showEditModal.value = false
    }

    const cancelEdit = () => {
      showEditModal.value = false
      editingFile.value = {}
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

    const truncatedFileName = (name: string) => {
      return name.length > 10 ? name.substring(0, 10) + '...' : name
    }

    return {
      truncatedFileName,
      showEditModal,
      showDeleteModal,
      editingFile,
      handleEdit,
      handleDelete,
      handleView,
      saveEdit,
      cancelEdit,
      confirmDelete,
      cancelDelete,
      formatDate,
      formatSize,
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

.table-container {
  position: relative;
  height: 100%;
  min-height: 400px;
  max-height: calc(86vh - 300px); // Adjust based on your layout
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.files-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    text-align: left;
    white-space: nowrap;

    &:first-child {
      padding-left: 24px;
    }

    &:last-child {
      padding-right: 24px;
    }
  }

  thead {
    tr {
      height: 48px;
      background: #f8f9fa;
    }

    th {
      position: sticky;
      top: 0;
      background: #f8f9fa;
      z-index: 1;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }
  }
}

.table-body-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 8px;
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

  tbody {
    tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f7fafc;
      }

      td {
        vertical-align: middle;
      }
    }
  }
}

.file-name {
  color: #2196f3;
  cursor: pointer;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;

  .btn {
    padding: 6px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    transition: background-color 0.2s;

    &:hover {
      background: #f5f5f5;
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
