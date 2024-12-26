<template>
  <tbody>
    <tr v-for="row in rows" :key="row.id">
      <TableCell
        v-for="column in visibleColumns"
        :key="column.key"
        :column="column"
        :row="row"
        :width="column.width"
        @edit="$emit('edit', row)"
        @delete="$emit('delete', row.id)"
        @copy="$emit('copy', row)"
        @view="$emit('view', row)"
        @action="$emit('action', { row, column })"
      />
    </tr>
  </tbody>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Column, Row } from '@/types/generic'
import TableCell from './TableCell.vue'

export default defineComponent({
  name: 'TableBody',
  components: {
    TableCell,
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
  },
  emits: ['edit', 'delete', 'view', 'action', 'copy'],
})
</script>

<style lang="scss" scoped>
tbody {
  height: 100%;

  tr {
    border-bottom: 1px solid #e2e8f0;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f7fafc;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
