<template>
  <div class="column-visibility-toggle">
    <button
      class="toggle-button"
      @click="showDropdown = !showDropdown"
      ref="toggleButton"
    >
      <span>Columns</span>
      <AppIcon type="settings" />
    </button>

    <div
      v-if="showDropdown"
      class="dropdown-menu"
      :style="dropdownStyle"
      ref="dropdown"
    >
      <div class="dropdown-header">
        <h3>Visible Columns</h3>
        <AppButton
          classes="reset-button"
          @click="resetToDefault"
          text="Reset"
        ></AppButton>
      </div>
      <div class="columns-list">
        <label
          v-for="column in columns"
          :key="column.key"
          class="column-option"
        >
          <AppInput
            type="checkbox"
            :name="`column-${column.key}`"
            :modelValue="column.visible"
            @update:modelValue="(value) => toggleColumn(column, value)"
            :disabled="column.key === 'name' || column.key === 'actions'"
          />
          <span>{{ column.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, PropType } from 'vue'
import { defaultColumns } from '../FilesTable/configuration'
import { Column } from '@/types/generic'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import AppInput from '../AppInput.vue'

export default defineComponent({
  name: 'ColumnVisibilityToggle',
  components: { AppIcon, AppButton, AppInput },

  props: {
    columns: {
      type: Array as PropType<Column[]>,
      required: true,
    },
  },

  emits: ['update:columns'],

  setup(props, { emit }) {
    const showDropdown = ref(false)
    const toggleButton = ref<HTMLElement | null>(null)
    const dropdown = ref<HTMLElement | null>(null)
    const dropdownStyle = ref({})

    const toggleColumn = (column: Column, value: boolean) => {
      const updatedColumns = props.columns.map((col) => {
        if (col.key === column.key) {
          return { ...col, visible: value }
        }
        return col
      })
      emit('update:columns', updatedColumns)
    }

    const resetToDefault = () => {
      emit('update:columns', defaultColumns)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown.value &&
        !toggleButton.value?.contains(event.target as Node) &&
        !dropdown.value?.contains(event.target as Node)
      ) {
        showDropdown.value = false
      }
    }

    const updateDropdownPosition = () => {
      if (toggleButton.value) {
        const rect = toggleButton.value.getBoundingClientRect()
        dropdownStyle.value = {
          top: `${rect.bottom + window.scrollY + 5}px`,
          right: `${window.innerWidth - rect.right}px`,
        }
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('scroll', updateDropdownPosition)
      window.addEventListener('resize', updateDropdownPosition)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', updateDropdownPosition)
      window.removeEventListener('resize', updateDropdownPosition)
    })

    const showDropdownModel = () => {
      showDropdown.value = !showDropdown.value
    }

    return {
      showDropdown,
      toggleButton,
      dropdown,
      dropdownStyle,
      toggleColumn,
      resetToDefault,
      showDropdownModel,
    }
  },
})
</script>

<style lang="scss" scoped>
.column-visibility-toggle {
  position: relative;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #4a5568;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }

  .icon {
    font-size: 16px;
  }
}

.dropdown-menu {
  position: fixed;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  right: 84px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #2d3748;
  }

  .reset-button {
    padding: 4px 8px;
    font-size: 12px;
    color: #4299e1;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.columns-list {
  padding: 8px 0;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }
}

.column-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  color: #4a5568;

  &:hover {
    background: #f7fafc;
  }

  input[type='checkbox'] {
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }
  }
}
</style>
