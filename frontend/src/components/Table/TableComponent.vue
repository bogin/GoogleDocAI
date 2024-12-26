<template>
  <div class="table-wrapper">
    <div class="table-header-container">
      <table class="data-table">
        <TableHeader :columns="visibleColumns" />
      </table>
    </div>
    <div class="table-body-container">
      <table class="data-table">
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
    </div>
    <div class="table-footer-container">
      <TablePagination
        :pagination="pagination"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
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
.table-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header-container {
  position: sticky;
  top: 0;
  z-index: 2;
  background: white;
}

.table-body-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 8px;
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

.table-footer-container {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: white;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  table-layout: fixed;
}
</style>
