<template>
  <div v-if="show" class="modal">
    <div class="modal-content">
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete this file?</p>
      <div class="modal-actions">
        <button @click="$emit('confirm')" class="btn btn-danger">Delete</button>
        <button @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DeleteConfirmationModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['confirm', 'cancel'],
})
</script>

<style lang="scss" scoped>
.modal {
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

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    min-width: 400px;
    max-width: 90vw;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 16px 0;
      color: #2d3748;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;

        &-secondary {
          background: #e2e8f0;
          color: #4a5568;

          &:hover {
            background: #cbd5e0;
          }
        }

        &-danger {
          background: #f44336;
          color: white;

          &:hover {
            background: #d32f2f;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .modal .modal-content {
    min-width: unset;
    width: 90%;
    margin: 20px;
  }
}
</style>
