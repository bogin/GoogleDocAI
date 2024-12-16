<template>
  <div class="files-table">
    <table v-if="files.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Modified</th>
          <th>Owner</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id">
          <td>{{ file.name }}</td>
          <td>{{ formatDate(file.modifiedTime) }}</td>
          <td>{{ file.owners[0]?.displayName }}</td>
          <td>{{ formatSize(file.size) }}</td>
          <td>
            <button @click="$emit('edit', file.id)">Edit</button>
            <button @click="$emit('delete', file.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="loading">Loading...</div>
    <div v-else>No files found</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "FilesTable",

  props: {
    files: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["edit", "delete"],

  setup() {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleString();
    };
    const formatSize = (bytes: number) => {
      if (!bytes) return "N/A";
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return {
      formatDate,
      formatSize,
    };
  },
});
</script>
