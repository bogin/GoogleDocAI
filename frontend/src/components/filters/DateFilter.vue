<template>
  <div class="date-range">
    <input
      type="datetime-local"
      :value="startDate"
      @input="
        $emit('update:startDate', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "DateRangeFilter",

  props: {
    startDate: {
      type: String,
      default: null,
    },
  },

  emits: ["update:startDate"],
});
</script>
