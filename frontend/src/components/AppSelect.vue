<template>
  <div
    class="input-wrapper"
    :class="[
      {
        'input-focused': isFocused,
        'input-disabled': disabled,
      },
    ]"
  >
    <label v-if="label" :for="name" class="input-label">
      {{ label }}
    </label>

    <div class="input-container">
      <select
        :id="name"
        :name="name"
        :value="modelValue"
        @change="handleInput"
        @focus="onFocus"
        @blur="onBlur"
        :required="required"
        :disabled="disabled"
        :class="selectClasses"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <slot name="prefix" class="input-prefix"></slot>
      <slot name="suffix" class="input-suffix"></slot>
    </div>

    <span v-if="error" class="input-error">
      {{ error }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'

interface Option {
  value: string | number
  label: string
}

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array as () => Option[],
    required: true,
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'change'])

const isFocused = ref(false)

const selectClasses = computed(() => {
  return [
    'input-field',
    {
      'input-disabled': props.disabled,
      'input-error': props.error,
    },
  ]
})

const handleInput = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value)
  emit('change', value)
}

const onFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  position: relative;
}

.input-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
  padding-right: 2rem;
}

.input-field:focus {
  outline: none !important;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.input-disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.input-field.input-error {
  border-color: #e53e3e;
}

.input-error {
  color: #e53e3e;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
