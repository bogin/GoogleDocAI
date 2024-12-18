<template>
  <div class="file-details">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="file" class="file-content">
      <h3>{{ file.name }}</h3>

      <div class="details-grid">
        <div class="detail-item">
          <label>ID:</label>
          <span>{{ file.id }}</span>
        </div>

        <div class="detail-item">
          <label>Size:</label>
          <span>{{ formatSize(file.size) }}</span>
        </div>

        <div class="detail-item">
          <label>Modified:</label>
          <span>{{ formatDate(file.modifiedTime) }}</span>
        </div>

        <div class="detail-item">
          <label>Owner:</label>
          <span>{{ file.owners?.[0]?.name || "Unknown" }}</span>
        </div>
      </div>

      <div class="actions">
        <button @click="$emit('edit', file)" class="btn edit">Edit</button>
        <button @click="$emit('delete', file.id)" class="btn delete">
          Delete
        </button>
      </div>
    </div>
    <div v-else class="no-file">No file selected</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { File } from "@/types/files";

export default defineComponent({
  name: "FileDetails",

  props: {
    file: {
      type: Object as PropType<File | null>,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },

  emits: {
    edit: (file: File) => !!file,
    delete: (fileId: string) => !!fileId,
  },

  methods: {
    formatSize(bytes: number): string {
      if (!bytes) return "N/A";
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    },

    formatDate(date: string): string {
      return new Date(date).toLocaleString();
    },
  },
});
</script>

<style lang="scss" scoped>
.file-details {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;

    .detail-item {
      label {
        font-weight: bold;
        margin-right: 8px;
        color: #666;
      }
    }
  }

  .actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;

    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;

      &.edit {
        background: #4caf50;
        color: white;
      }

      &.delete {
        background: #f44336;
        color: white;
      }
    }
  }

  .loading,
  .error,
  .no-file {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .error {
    color: #f44336;
  }
}
</style>
