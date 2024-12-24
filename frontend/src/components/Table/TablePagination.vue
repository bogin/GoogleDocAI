<template>
  <div class="pagination-section">
    <div class="pagination-info">
      <span
        >{{ startItem }} - {{ endItem }} of
        {{ pagination.totalItems }} files</span
      >
    </div>

    <div class="pagination-controls">
      <div class="page-navigation">
        <AppButton
          classes="nav-button"
          :disabled="pagination.currentPage === 1"
          @click="changePage(pagination.currentPage - 1)"
          icon="chevronLeft"
        />

        <div class="page-numbers">
          <template v-for="pageNum in visiblePages" :key="pageNum">
            <AppButton
              v-if="pageNum !== '...'"
              :classes="`${
                pageNum === pagination.currentPage ? 'active' : ''
              } page-button`"
              @click="changePage(pageNum)"
              :text="`${pageNum}`"
            />
            <span v-else class="page-ellipsis">···</span>
          </template>
        </div>

        <AppButton
          classes="nav-button"
          :disabled="pagination.currentPage === pagination.totalPages"
          @click="changePage(pagination.currentPage + 1)"
          icon="chevronRight"
        />
      </div>

      <div class="page-size">
        <AppSelect
          v-model="localPageSize"
          name="pageSize"
          :options="[
            { value: '10', label: '10 per page' },
            { value: '25', label: '25 per page' },
            { value: '50', label: '50 per page' },
          ]"
          @change="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import AppButton from '../AppButton.vue'
import AppSelect from '../AppSelect.vue'

const props = defineProps({
  pagination: {
    type: Object,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
})

const emit = defineEmits(['page-change', 'size-change'])

const localPageSize = ref(props.pageSize)

const startItem = computed(
  () => (props.pagination.currentPage - 1) * props.pagination.pageSize + 1
)

const endItem = computed(() =>
  Math.min(
    props.pagination.currentPage * props.pagination.pageSize,
    props.pagination.totalItems
  )
)

const visiblePages = computed(() => {
  const current = props.pagination.currentPage
  const total = props.pagination.totalPages
  const delta = 2

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const left = current - delta
  const right = current + delta
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})

const changePage = (page) => {
  if (page > 0 && page <= props.pagination.totalPages) {
    emit('page-change', page)
  }
}

const handlePageSizeChange = () => {
  const newSize = parseInt(localPageSize.value, 10)
  emit('size-change', newSize)
}

watch(
  () => props.pageSize,
  (newSize) => {
    localPageSize.value = newSize
  }
)
</script>

<style lang="scss" scoped>
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  margin-top: 8px;

  .pagination-info {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .page-navigation {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      .nav-button {
        width: 36px;
        height: 36px;
        padding: 0;
        color: #64748b;
        background: transparent;
        border: none;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          background: #e2e8f0;
          color: #1e293b;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .page-numbers {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        .page-button {
          width: 36px;
          height: 36px;
          padding: 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          background: transparent;
          border: none;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover:not(.active) {
            background: #e2e8f0;
            color: #1e293b;
          }

          &.active {
            background: #2563eb;
            color: white;
          }
        }

        .page-ellipsis {
          color: #94a3b8;
          padding: 0 0.25rem;
          user-select: none;
        }
      }
    }

    .page-size {
      :deep(.input-wrapper) {
        margin-bottom: 0;
        min-width: 140px;

        .input-field {
          height: 42px;
          background: #f8fafc;
          border-color: #e2e8f0;
          font-size: 0.875rem;
          color: #64748b;

          &:hover {
            border-color: #cbd5e1;
            background: white;
          }

          &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .pagination-section {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;

    .pagination-controls {
      width: 100%;
      flex-direction: column;
      gap: 1rem;

      .page-navigation {
        width: 100%;
        justify-content: center;
      }

      .page-size {
        width: 100%;
      }
    }
  }
}
</style>
