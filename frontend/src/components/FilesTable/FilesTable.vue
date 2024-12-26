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
        <TableComponent
          :rows="files"
          :visible-columns="visibleColumns"
          :pagination="pagination"
          :page-size="pageSize"
          @edit="handleEdit"
          @delete="handleDelete"
          @copy="copyLink"
          @view="openLink"
          @page-change="$emit('page-change', $event)"
          @size-change="$emit('size-change', $event)"
        />
      </div>
    </div>

    <DeleteConfirmationModal
      :show="showDeleteModal"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <AppToast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

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
import { File } from '@/types/files'
import { defaultColumns } from './configuration'
import ColumnVisibilityToggle from '../Table/ColumnVisibilityToggle.vue'
import AppToast from '../Toast.vue'
import DynamicForm from '../DynamicForm.vue'
import TableComponent from '../Table/TableComponent.vue'
import DeleteConfirmationModal from '../DeleteConfirmationModal.vue'
import { FormField } from '@/types/formField'
import { Column } from '@/types/generic'

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
    TableComponent,
    DeleteConfirmationModal,
  },

  props: {
    files: {
      type: Array as PropType<File[]>,
      required: true,
    },
    pagination: {
      type: Object as PropType<any>,
      required: true,
    },
    pageSize: {
      type: Number,
      required: true,
    },
  },

  emits: ['delete', 'update', 'page-change', 'size-change'],

  setup(props, { emit }) {
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')
    const showDeleteModal = ref(false)
    const showForm = ref(false)
    const editingFile = ref<Partial<File> | null>(null)
    const deletingFileId = ref<string | null>(null)
    const columns = ref<Column[]>(defaultColumns)

    const visibleColumns = computed(() => {
      return columns.value.filter((column) => column.visible)
    })

    const updateColumns = (newColumns: Column[]) => {
      columns.value = newColumns
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

    const copyLink = async (file: File) => {
      try {
        await navigator.clipboard.writeText(`${file.webViewLink}`)
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

    const openLink = (file: File) => {
      window.open(file.webViewLink, '_blank')
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
      openLink,
      handleDelete,
      confirmDelete,
      cancelDelete,
      updateColumns,
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
  min-height: 30vh;
  max-height: 66vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
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

@media (max-width: 768px) {
  .modal .modal-content {
    min-width: unset;
    width: 90%;
    margin: 20px;
  }
}
</style>
