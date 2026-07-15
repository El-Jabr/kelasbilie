<script setup lang="ts">
const {
  pagination,
  changePage
} = useAcademicYears()
</script>

<template>
  <div class="flex justify-end">
    <UPagination
      :page="pagination.page"
      :items-per-page="pagination.limit"
      :total="pagination.total"
      @update:page="changePage"
    />
  </div>
</template>
