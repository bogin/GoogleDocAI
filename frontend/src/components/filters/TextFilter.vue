<template>
  <div class="search-container">
    <div class="search-box" :class="{ 'is-focused': isFocused }">
      <AppButton @click="handleSearch" classes="search-icon" icon="search">
      </AppButton>

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
      <AppButton @click="clearSearch" classes="clear-button" icon="close">
      </AppButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
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
