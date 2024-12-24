<template>
  <section class="filters-section">
    <div class="filters-container">
      <div class="filter-group">
        <AppInput
          v-model="localFilters.query"
          name="search"
          placeholder="Search files..."
          @input="handleSearch"
        >
          <template #prefix>
            <i class="ri-search-line"></i>
          </template>
        </AppInput>
      </div>

      <div class="filter-group date-input-container">
        <AppInput
          v-model="localFilters.modifiedTime"
          name="date"
          type="date"
          placeholder="Modified After"
          @input="handleDateChange"
        >
          <template #prefix>
            <i class="ri-calendar-line"></i>
          </template>
        </AppInput>
      </div>

      <AppButton
        @click="applyFilters"
        classes="apply-filters-btn"
        text="Apply Filters"
      />
    </div>

    <div class="active-filters" v-if="hasActiveFilters">
      <div class="filter-tag" v-if="localFilters.query">
        <span>Search: {{ localFilters.query }}</span>
        <AppButton
          @click="clearTextFilter"
          classes="clear-filter"
          icon="close"
        />
      </div>

      <div class="filter-tag" v-if="localFilters.modifiedTime">
        <span>Modified after: {{ formatDate(localFilters.modifiedTime) }}</span>
        <AppButton
          @click="clearDateFilter"
          classes="clear-filter"
          icon="close"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import AppInput from '../AppInput.vue'
import AppButton from '../AppButton.vue'

interface Filters {
  query: string
  modifiedTime?: string
}

const props = defineProps<{
  modelValue: Filters
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Filters): void
  (e: 'apply'): void
}>()

const localFilters = ref<Filters>({
  query: props.modelValue.query,
  modifiedTime: props.modelValue.modifiedTime,
})

const hasActiveFilters = computed(() => {
  return Boolean(localFilters.value.query || localFilters.value.modifiedTime)
})

const handleSearch = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const handleDateChange = () => {
  emit('update:modelValue', { ...localFilters.value })
}

const clearTextFilter = () => {
  localFilters.value.query = ''
  emit('update:modelValue', { ...localFilters.value })
  emit('apply')
}

const clearDateFilter = () => {
  localFilters.value.modifiedTime = undefined
  emit('update:modelValue', { ...localFilters.value })
  emit('apply')
}

const applyFilters = () => {
  emit('apply')
}

const formatDate = (date: string | null) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.filters-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;

  .filters-container {
    display: grid;
    grid-template-columns: minmax(300px, 1fr) 200px auto;
    gap: 1rem;
    padding: 1rem;
    align-items: center;

    .filter-group {
      :deep(.input-wrapper) {
        margin-bottom: 0;

        .input-field {
          width: 100%;
          height: 42px;
          padding: 0 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9375rem;
          background: #f8fafc;
          transition: all 0.2s ease;
          cursor: pointer;

          &:hover {
            border-color: #cbd5e1;
            background: white;
          }

          &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: white;
          }
        }

        .input-prefix {
          color: #64748b;
          padding-left: 1rem;
          pointer-events: none;
        }
      }
    }

    .date-input-container {
      cursor: pointer;

      :deep(.input-wrapper) {
        cursor: pointer;

        .input-field {
          cursor: pointer;
        }
      }
    }

    .apply-filters-btn {
      height: 42px;
      padding: 0 1.5rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .active-filters {
    padding: 0.75rem 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    border-top: 1px solid #f1f5f9;

    .filter-tag {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;

      .clear-filter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-left: 0.25rem;
        border: none;
        background: none;
        color: #64748b;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.15s ease;

        &:hover {
          background: #e2e8f0;
          color: #dc2626;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .filters-section {
    .filters-container {
      grid-template-columns: 1fr;
      gap: 1rem;

      .filter-group,
      .apply-filters-btn {
        width: 100%;
      }
    }
  }
}
</style>
