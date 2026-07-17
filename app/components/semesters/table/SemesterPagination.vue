<script setup lang="ts">
const {
  pagination,
  changePage,
  changeLimit
} = useSemesters()
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="text-sm text-muted">
      Menampilkan
      {{ (pagination.page - 1) * pagination.limit + 1 }}
      -
      {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
      dari
      {{ pagination.total }}
      data
    </div>

    <div class="flex items-center gap-4">
      <USelect
        :model-value="pagination.limit"
        :items="[10, 25, 50, 100]"
        class="w-24"
        @update:model-value="changeLimit"
      />

      <UPagination
        :page="pagination.page"
        :items-per-page="pagination.limit"
        :total="pagination.total"
        @update:page="changePage"
      />
    </div>
  </div>
</template>
