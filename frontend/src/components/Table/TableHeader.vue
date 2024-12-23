<template>
  <thead>
    <tr>
      <th
        v-for="column in columns"
        :key="column.key"
        :style="{ width: column.width }"
      >
        {{ column.label }}
      </th>
    </tr>
  </thead>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Column } from '@/types/generic'

export default defineComponent({
  name: 'TableHeader',
  props: {
    columns: {
      type: Array as PropType<Column[]>,
      required: true,
    },
  },
})
</script>

<style lang="scss" scoped>
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
  }
}
</style>
