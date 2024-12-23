<template>
  <table class="data-table">
    <TableHeader :columns="visibleColumns" />
    <TableBody
      :rows="rows"
      :visible-columns="visibleColumns"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @copy="$emit('copy', $event)"
      @action="$emit('action', $event)"
    />
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Column, Row } from '@/types/generic'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'

export default defineComponent({
  name: 'DataTable',
  components: {
    TableHeader,
    TableBody,
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
  emits: ['edit', 'delete', 'action', 'copy'],
})
</script>

<style lang="scss" scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}
</style>
