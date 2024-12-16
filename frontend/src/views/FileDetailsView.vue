<template>
  <div class="file-details-view">
    <div class="header">
      <h2>File Details</h2>
      <button @click="goBack" class="back-btn">Back to Files</button>
    </div>

    <FileDetails
      :file="currentFile"
      :loading="loading"
      :error="error"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import FileDetails from "@/components/files/FileDetails.vue";
import { File } from "@/types/files";

export default defineComponent({
  name: "FileDetailsView",

  components: {
    FileDetails,
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    // Load the file details when component mounts
    store.dispatch("files/fetchFileById", route.params.id);

    const currentFile = computed(() => store.state.files.currentFile);
    const loading = computed(() => store.state.files.loading);
    const error = computed(() => store.state.files.error);

    const goBack = () => router.push("/files");

    const handleEdit = async (file: File) => {
      try {
        await store.dispatch("files/updateFile", {
          fileId: file.id,
          data: file,
        });
        goBack();
      } catch (error) {
        console.error("Failed to update file:", error);
      }
    };

    const handleDelete = async (fileId: string) => {
      if (confirm("Are you sure you want to delete this file?")) {
        try {
          await store.dispatch("files/deleteFile", fileId);
          goBack();
        } catch (error) {
          console.error("Failed to delete file:", error);
        }
      }
    };

    return {
      currentFile,
      loading,
      error,
      goBack,
      handleEdit,
      handleDelete,
    };
  },
});
</script>

<style lang="scss" scoped>
.file-details-view {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .back-btn {
      padding: 8px 16px;
      background: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: #1976d2;
      }
    }
  }
}
</style>
