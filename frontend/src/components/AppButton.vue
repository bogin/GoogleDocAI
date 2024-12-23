<template>
  <button :class="buttonClasses" @click="$emit('click', $event)">
    {{ text }}
    <AppIcon v-if="icon" type="icon"></AppIcon>
  </button>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { defineProps, defineEmits } from 'vue'

defineProps({
  component: { AppIcon },
  text: {
    type: String,
    default: 'Button',
  },
  class: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
})

defineEmits(['click'])
</script>
