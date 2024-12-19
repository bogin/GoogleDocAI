<template>
  <div class="date-range">
    <div class="date-input-wrapper">
      <input
        type="datetime-local"
        :value="startDate"
        @change="handleDateChange"
        class="date-input"
      />
      <button
        v-if="startDate"
        @click="clearDate"
        class="clear-date-btn"
        title="Clear date"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DateFilter',

  props: {
    startDate: {
      type: String,
      default: null,
    },
  },

  emits: ['update:modelValue'],

  methods: {
    handleDateChange(event: Event) {
      const input = event.target as HTMLInputElement
      // Emit the new date value
      this.$emit('update:modelValue', input.value || null)
    },

    clearDate() {
      // Emit null to clear the date
      this.$emit('update:modelValue', null)
    },
  },
})
</script>

<style scoped>
.date-range {
  display: flex;
  align-items: center;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.clear-date-btn {
  background: none;
  border: none;
  color: #718096;
  margin-left: -25px;
  cursor: pointer;
  padding: 0 5px;
}

.clear-date-btn:hover {
  color: #e53e3e;
}
</style>
