<script setup lang="ts">
const {
  pagination,
  changePage,
  changeLimit
} = useSemesters()
</script>

<template>
  <div class="flex items-center justify-end">
    <div class="flex items-center gap-4">
      <UPagination
        :page="pagination.page"
        :items-per-page="pagination.limit"
        :total="pagination.total"
        @update:page="changePage"
      />
    </div>
  </div>
</template>
