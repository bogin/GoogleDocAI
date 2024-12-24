<template>
  <div
    class="input-wrapper"
    :class="[
      type,
      {
        'input-focused': isFocused,
        'input-disabled': disabled,
        'input-checkbox': type === 'checkbox',
      },
    ]"
  >
    <template v-if="type === 'checkbox'">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :id="name"
          :name="name"
          :checked="modelValue"
          @change="handleInput"
          :disabled="disabled"
          :required="required"
          :class="inputClasses"
        />
        <span>{{ label }}</span>
      </label>
    </template>

    <template v-else>
      <label v-if="label" :for="name" class="input-label">
        {{ label }}
      </label>

      <div class="input-container">
        <input
          :type="type"
          :id="name"
          :name="name"
          :value="modelValue"
          @input="handleInput"
          @focus="onFocus"
          @blur="onBlur"
          :placeholder="placeholder"
          :required="required"
          :disabled="disabled"
          :min="min"
          :max="max"
          :step="step"
          :class="inputClasses"
        />

        <slot name="prefix" class="input-prefix"></slot>
        <slot name="suffix" class="input-suffix"></slot>
      </div>
    </template>

    <span v-if="error" class="input-error">
      {{ error }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (value) =>
      [
        'text',
        'number',
        'email',
        'password',
        'search',
        'tel',
        'url',
        'date',
        'time',
        'datetime-local',
        'checkbox',
        'radio',
      ].includes(value),
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
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
  min: {
    type: [String, Number],
    default: null,
  },
  max: {
    type: [String, Number],
    default: null,
  },
  step: {
    type: [String, Number],
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'change'])

const isFocused = ref(false)

const inputClasses = computed(() => {
  return [
    'input-field',
    props.type,
    {
      'input-disabled': props.disabled,
      'input-error': props.error,
    },
  ]
})

const handleInput = (event) => {
  const value =
    props.type === 'checkbox' ? event.target.checked : event.target.value

  emit('update:modelValue', value)
  emit('change', value)
}

const onFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event) => {
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

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
}

.input-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label input[type='checkbox'] {
  margin: 0;
}

.checkbox-label span {
  user-select: none;
}
</style>
