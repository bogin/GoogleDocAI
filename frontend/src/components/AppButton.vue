<template>
  <button
    :disabled="disabled"
    :class="classes"
    :type="buttonType"
    @click="$emit('click', $event)"
  >
    <span v-if="text">{{ text }}</span>
    <AppIcon v-if="icon" :type="icon"></AppIcon>
    <div v-if="children">{{ children }}</div>
  </button>
</template>

<script setup>
import AppIcon from './AppIcon.vue'
import { defineProps, defineEmits } from 'vue'

defineProps({
  component: {
    type: Object,
    default: () => AppIcon,
  },
  text: {
    type: String,
    default: '',
    required: false,
  },
  buttonType: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  classes: {
    type: String,
    default: '',
    required: false,
  },
  icon: {
    type: String,
    default: '',
    required: false,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
  children: {
    type: [String, Number, Object],
    default: '',
    required: false,
  },
})

defineEmits(['click'])
</script>
