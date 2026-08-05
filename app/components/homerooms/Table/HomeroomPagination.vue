<script setup lang="ts">
const { pagination, changePage, changeLimit } = useHomerooms()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex w-full justify-between items-center gap-2 text-sm text-gray-500">
      <USelect
        :model-value="pagination.limit"
        :items="[
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 }
        ]"
        value-key="value"
        label-key="label"
        class="w-20"
        @update:model-value="changeLimit(Number($event))"
      />
      <UPagination
        v-if="pagination.total > 0"
        :page="pagination.page"
        :total="pagination.total"
        :items-per-page="pagination.limit"
        @update:page="changePage"
      />
    </div>

  </div>
</template>
