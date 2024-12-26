<template>
  <span class="icon" :class="[type, { 'icon-large': large }]">
    {{ iconMap[type] || type }}
  </span>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  type: {
    type: String,
    required: true,
  },
  large: {
    type: Boolean,
    default: false,
  },
})

const iconMap = {
  settings: '⚙️',
  user: '👤',
  mail: '✉️',
  heart: '❤️',
  star: '⭐',
  check: '✅',
  close: '×',
  info: 'ℹ️',
  warning: '⚠️',
  delete: '🗑️',
  edit: '✏️',
  copy: '📋',
  search: '🔍',
  chevronLeft: '◀️',
  chevronRight: '▶️',
  view: '👁️',
  expendOpen: '▶',
  expendClosed: '▼',
  folder: '📁',
}
</script>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
}

.icon-large {
  font-size: 1.5em;
}
</style>
