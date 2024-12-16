<template>
  <div class="files">
    <h2>Files Management</h2>
    <div class="filters">
      <TextFilter
        v-model="filters.textQuery"
        @update:modelValue="handleFiltersChange"
      />
      <DateFilter
        v-model:startDate="filters.modifiedAfter"
        @update:startDate="handleFiltersChange"
      />
    </div>

    <FilesTable
      :files="files"
      :loading="loading"
      @delete="handleDelete"
      @edit="handleEdit"
    />
  </div>
</template>

<script lang="ts">
import FilesTable from "@/components/FilesTable.vue";
import DateFilter from "@/components/filters/DateFilter.vue";
import TextFilter from "@/components/filters/TextFilter.vue";
import { defineComponent, ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
//   import TextSearchFilter from '@/components/files/filters/TextSearchFilter.vue'
//   import DateRangeFilter from '@/components/files/filters/DateRangeFilter.vue'
//   import FilesTable from '@/components/files/FilesTable.vue'

export default defineComponent({
  name: "FilesView",
  components: {
    TextFilter,
    DateFilter,
    FilesTable,
  },

  setup() {
    const store = useStore();
    const currentPage = ref(1);
    const filters = ref({
      textQuery: "",
      modifiedAfter: null,
    });

    const files = computed(() => store.state.files.items);
    const loading = computed(() => store.state.files.loading);

    const fetchFiles = () => {
      store.dispatch("files/fetchFiles", {
        page: currentPage.value,
        ...filters.value,
      });
    };

    const handleFiltersChange = () => {
      currentPage.value = 1;
      fetchFiles();
    };

    const handleDelete = () => {
      console.log(`Delete`);
    };

    const handleEdit = () => {
      console.log(`Edit`);
    };

    onMounted(fetchFiles);

    return {
      files,
      loading,
      filters,
      handleFiltersChange,
      handleDelete,
      handleEdit,
    };
  },
});
</script>

<style lang="scss" scoped>
.files {
  padding: 20px;

  .filters {
    margin: 20px 0;
    display: flex;
    gap: 20px;
  }
}
</style>
