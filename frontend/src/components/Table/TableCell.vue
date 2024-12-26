<template>
  <td :style="{ width }">
    <template v-if="column.key === 'actions'">
      <div class="actions">
        <AppButton
          v-for="action in defaultActions"
          :key="action.type"
          class="btn"
          :classes="`btn-${action.type}`"
          @click="handleAction(action.type, $event)"
          :icon="action.icon"
        ></AppButton>
      </div>
    </template>
    <template v-else>
      <span :title="formatValue">
        {{ formatValue }}
      </span>
    </template>
  </td>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { Column, Row } from '@/types/generic'
import AppButton from '@/components/AppButton.vue'

export default defineComponent({
  name: 'TableCell',
  components: { AppButton },
  props: {
    column: {
      type: Object as PropType<Column>,
      required: true,
    },
    row: {
      type: Object as PropType<Row>,
      required: true,
    },
    width: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const defaultActions = [
      { type: 'copy', icon: 'copy', title: 'Copy' },
      { type: 'edit', icon: 'edit', title: 'Edit' },
      { type: 'delete', icon: 'delete', title: 'Delete' },
      { type: 'view', icon: 'view', title: 'View File' },
    ]

    const formatValue = computed(() => {
      if (props.column.key === 'actions') return ''

      const value = props.column.key.includes('.')
        ? props.column.key
            .split('.')
            .reduce((obj: any, key) => obj?.[key], props.row)
        : (props.row as any)[props.column.key]

      return props.column.formatter
        ? props.column.formatter(value, props.row)
        : value
    })

    const handleAction = (type: string, event: Event) => {
      event.stopPropagation()
      switch (type) {
        case 'copy': {
          emit('copy', props.row)
          break
        }
        case 'edit': {
          emit('edit', props.row)
          break
        }
        case 'delete': {
          emit('delete', props.row)
          break
        }
        case 'view': {
          emit('view', props.row)
          break
        }
      }
    }

    return {
      formatValue,
      defaultActions,
      handleAction,
    }
  },
  emits: ['edit', 'delete', 'copy', 'view'],
})
</script>

<style lang="scss" scoped>
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
}
</style>
