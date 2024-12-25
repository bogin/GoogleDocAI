<template>
  <div class="modal-overlay" v-if="show" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? 'Edit' : 'Create' }} {{ title }}</h3>
        <AppButton
          @click="closeModal"
          classes="close-button"
          icon="close"
        ></AppButton>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div v-for="field in formConfig" :key="field.name" class="form-group">
          <template v-if="field.type === 'text' || field.type === 'number'">
            <AppInput
              :type="field.type"
              :name="field.name"
              :label="field.label"
              v-model="formData[field.name]"
              :placeholder="field.placeholder || ''"
              :required="field.required"
              :min="field.min"
              :max="field.max"
            />
          </template>

          <template v-if="field.type === 'select'">
            <AppSelect
              v-model="formData[field.name]"
              :name="field.name"
              :label="field.label"
              :required="field.required"
              :placeholder="`Select ${field.label}`"
              :options="field.options!"
            />
          </template>

          <template v-if="field.type === 'checkbox'">
            <AppInput
              type="checkbox"
              :name="field.name"
              :label="field.label"
              v-model="formData[field.name]"
            />
          </template>

          <span class="error-message" v-if="errors[field.name]">
            {{ errors[field.name] }}
          </span>
        </div>

        <div class="form-actions">
          <AppButton
            @click="closeModal"
            classes="btn btn-secondary"
            text="Cancel"
          ></AppButton>

          <AppButton
            classes="btn btn-primary"
            :text="isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'"
            :disabled="isSubmitting"
            buttonType="submit"
          ></AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { File } from '@/types/files'
import { FormField, FormErrors } from '@/types/formField'
import { defineComponent, ref, computed, PropType, watch } from 'vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppSelect from './AppSelect.vue'

export default defineComponent({
  name: 'DynamicForm',
  components: { AppButton, AppInput, AppSelect },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    formConfig: {
      type: Array as PropType<FormField[]>,
      required: true,
    },
    initialData: {
      type: Object as PropType<Partial<File> | null>,
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const formData = ref<Record<string, any>>(props.initialData || {})
    const errors = ref<FormErrors>({})
    const isSubmitting = ref(false)

    const isEdit = computed(
      () => props.initialData && Object.keys(props.initialData).length > 0
    )

    watch(
      () => props.initialData,
      (newData) => {
        formData.value = newData || {}
      }
    )

    const validate = (): boolean => {
      errors.value = {}
      let isValid = true

      props.formConfig.forEach((field: FormField) => {
        const value = formData.value[field.name]

        if (field.required && !value) {
          errors.value[field.name] = `${field.label} is required`
          isValid = false
        }

        if (field.validator && value !== undefined) {
          const error = field.validator(value)
          if (error) {
            errors.value[field.name] = error
            isValid = false
          }
        }
      })

      return isValid
    }

    const handleSubmit = async (): Promise<void> => {
      if (!validate()) return

      try {
        isSubmitting.value = true
        if (isEdit.value) {
          await emit('update', formData.value)
        } else {
          await emit('create', formData.value)
        }
        closeModal()
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        isSubmitting.value = false
      }
    }

    const closeModal = (): void => {
      formData.value = {}
      errors.value = {}
      emit('close')
    }

    return {
      formData,
      errors,
      isSubmitting,
      isEdit,
      handleSubmit,
      closeModal,
    }
  },
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #4a5568;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    line-height: 1;

    &:hover {
      background: #f7fafc;
      color: #2d3748;
    }
  }
}

.form {
  padding: 1.5rem;

  .form-group {
    margin-bottom: 1.25rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #4a5568;
      font-weight: 500;
    }

    input[type='text'],
    input[type='number'],
    select {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #2d3748;
      transition: all 0.2s;

      &:focus {
        outline: none !important;
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
      }

      &::placeholder {
        color: #a0aec0;
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .radio-group {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        cursor: pointer;
      }
    }
  }

  .error-message {
    color: #e53e3e;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;

      &-primary {
        background: #4299e1;
        color: white;
        border: none;

        &:hover:not(:disabled) {
          background: #3182ce;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }

      &-secondary {
        background: #edf2f7;
        color: #4a5568;
        border: none;

        &:hover {
          background: #e2e8f0;
        }
      }
    }
  }
}
</style>
