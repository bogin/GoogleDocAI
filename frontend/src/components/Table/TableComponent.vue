<template>
  <div class="table-wrapper">
    <table class="data-table">
      <TableHeader :columns="visibleColumns" />
      <TableBody
        :rows="rows"
        :visible-columns="visibleColumns"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @copy="$emit('copy', $event)"
        @action="$emit('action', $event)"
        @view="$emit('view', $event)"
      />
    </table>
    <TablePagination
      :pagination="pagination"
      :page-size="pageSize"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Column, Row } from '@/types/generic'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import TablePagination from './TablePagination.vue'

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

export default defineComponent({
  name: 'DataTable',
  components: {
    TableHeader,
    TableBody,
    TablePagination,
  },
  props: {
    rows: {
      type: Array as PropType<Row[]>,
      required: true,
    },
    visibleColumns: {
      type: Array as PropType<Column[]>,
      required: true,
    },
    pagination: {
      type: Object as PropType<Pagination>,
      required: true,
    },
    pageSize: {
      type: Number,
      required: true,
    },
  },
  emits: [
    'edit',
    'delete',
    'action',
    'copy',
    'page-change',
    'size-change',
    'view',
  ],
  setup(props, { emit }) {
    const handlePageChange = (page: number) => {
      emit('page-change', page)
    }

    const handleSizeChange = (size: number) => {
      emit('size-change', size)
    }

    return {
      handlePageChange,
      handleSizeChange,
    }
  },
})
</script>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;

  .data-table {
    margin-bottom: 1rem;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
  }

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}
</style>
