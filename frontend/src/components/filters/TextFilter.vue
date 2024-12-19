<template>
  <div class="search-container">
    <div class="search-box" :class="{ 'is-focused': isFocused }">
      <button class="search-icon" @click="handleSearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
          />
        </svg>
      </button>
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        @keyup.enter="handleSearch"
        @focus="isFocused = true"
        @blur="isFocused = false"
        placeholder="Search files..."
        class="search-input"
      />
      <button v-if="modelValue" @click="clearSearch" class="clear-button">
        ×
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'TextSearchFilter',

  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue', 'search'],

  setup(props, { emit }) {
    const isFocused = ref(false)
    const searchValue = ref(props.modelValue)

    const handleInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value
      emit('update:modelValue', value)
    }

    const handleSearch = () => {
      if (props.modelValue.trim()) {
        emit('search', props.modelValue)
      }
    }

    const clearSearch = () => {
      emit('update:modelValue', '')
      emit('search', '')
    }

    return {
      isFocused,
      handleInput,
      handleSearch,
      clearSearch,
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

  &:hover {
    background-color: #fff;
    box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
    border-color: rgba(223, 225, 229, 0);
  }

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

.search-icon {
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

.clear-button {
  padding: 0 8px;
  height: 44px;
  line-height: 44px;
  color: #70757a;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #202124;
  }
}
</style>
