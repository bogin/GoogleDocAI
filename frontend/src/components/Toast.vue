<template>
  <transition name="toast">
    <div v-if="show" class="toast" :class="type">
      {{ message }}
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'AppToast',
  props: {
    message: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 3000,
    },
    type: {
      type: String,
      default: 'success',
      validator: (value: string) =>
        ['success', 'error', 'info'].includes(value),
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const show = ref(true)

    onMounted(() => {
      setTimeout(() => {
        show.value = false
        emit('close')
      }, props.duration)
    })

    return {
      show,
    }
  },
})
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &.success {
    background: #52c41a;
  }

  &.error {
    background: #f5222d;
  }

  &.info {
    background: #1890ff;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
