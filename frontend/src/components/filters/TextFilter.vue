<template>
  <div class="search-container">
    <div class="search-box" :class="{ 'is-focused': isFocused }">
      <AppButton @click="handleSearch" classes="search-icon" icon="search" />
      <AppButton
        v-if="localSearchValue"
        @click="clearSearch"
        classes="clear-button"
        icon="close"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import AppButton from '../AppButton.vue'

export default defineComponent({
  name: 'TextSearchFilter',
  components: { AppButton },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue', 'search'],

  setup(props, { emit }) {
    const isFocused = ref(false)
    const localSearchValue = ref(props.modelValue)

    watch(
      () => props.modelValue,
      (newValue) => {
        localSearchValue.value = newValue
      }
    )

    const handleSearch = () => {
      const trimmedValue = localSearchValue.value.trim()
      if (trimmedValue) {
        emit('update:modelValue', trimmedValue)
        emit('search', trimmedValue)
      }
    }

    const clearSearch = () => {
      localSearchValue.value = ''
      emit('update:modelValue', '')
      emit('search', '')
    }

    const onFocus = () => {
      isFocused.value = true
    }

    const onBlur = () => {
      isFocused.value = false
    }

    watch(localSearchValue, (newValue) => {
      emit('update:modelValue', newValue)
    })

    return {
      localSearchValue,
      isFocused,
      handleSearch,
      clearSearch,
      onFocus,
      onBlur,
    }
  },
})
</script>

<style lang="scss" scoped>
.search-container {
  width: 100%;
  max-width: 584px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  align-items: center;
  height: 44px;
  background: #fff;
  border: 1px solid #dfe1e5;
  border-radius: 24px;
  padding: 0 8px;
  transition: all 0.2s;

  &:hover,
  &.is-focused {
    background-color: #fff;
    box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
    border-color: rgba(223, 225, 229, 0);
  }
}

.search-input {
  flex: 1;
  height: 34px;
  background: transparent;
  border: none;
  margin: 0 8px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  word-wrap: break-word;
  outline: none;
  padding: 0;
}

.search-icon,
.clear-button {
  padding: 0 8px;
  height: 44px;
  line-height: 44px;
  color: #9aa0a6;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #202124;
  }
}
</style>
