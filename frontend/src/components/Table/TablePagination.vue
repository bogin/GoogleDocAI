<template>
  <div class="pagination-container">
    <div class="pagination-summary">
      <span class="pagination-text">
        {{ startItem }} - {{ endItem }} of {{ pagination.totalItems }} files
      </span>
    </div>

    <div class="pagination-controls">
      <div class="page-selector">
        <AppButton
          classes="page-nav-btn"
          :disabled="pagination.currentPage === 1"
          @click="changePage(pagination.currentPage - 1)"
          icon="chevronLeft"
        ></AppButton>

        <div class="page-numbers">
          <template v-for="pageNum in visiblePages" :key="pageNum">
            <AppButton
              v-if="pageNum !== '...'"
              class="page-number-btn"
              :classes="pageNum === pagination.currentPage ? 'active' : ''"
              @click="changePage(pageNum)"
              :text="`${pageNum}`"
            ></AppButton>
            <span v-else class="page-ellipsis">...</span>
          </template>
        </div>

        <AppButton
          classes="page-nav-btn"
          :disabled="pagination.currentPage === pagination.totalPages"
          @click="changePage(pagination.currentPage + 1)"
          icon="chevronRight"
        ></AppButton>
      </div>

      <div class="page-size-selector">
        <select
          v-model="localPageSize"
          @change="handlePageSizeChange"
          class="page-size-dropdown"
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import AppButton from '../AppButton.vue'

const props = defineProps({
  components: { AppButton },
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
  emit('size-change', Number(localPageSize.value))
}

watch(
  () => props.pageSize,
  (newSize) => {
    localPageSize.value = newSize
  }
)
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.pagination-summary {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.page-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: background-color 0.2s;
}

.page-nav-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.page-nav-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-number-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number-btn:hover:not(.active) {
  background-color: #f3f4f6;
}

.page-number-btn.active {
  background-color: #3b82f6;
  color: white;
}

.page-ellipsis {
  color: #6b7280;
  margin: 0 0.5rem;
}

.page-size-dropdown {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  color: #374151;
  font-size: 0.875rem;
}

.page-size-dropdown:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
