<script setup lang="ts">
import { useSemesters } from '~/composables/useSemesters'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Semester'
})

const { fetchSemesters } = useSemesters()

await fetchSemesters()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Semester
      </h1>

      <p class="text-muted text-sm text-gray-500">
        Kelola semester sekolah.
      </p>
    </div>

    <SemestersToolbarSemesterToolbar />

    <SemestersTableSemesterTable />

    <SemestersTableSemesterPagination />

    <SemestersDialogsSemesterCreateDialog />

    <SemestersDialogsSemesterEditDialog />

    <SemestersDialogsSemesterDeleteDialog />

    <SemestersDialogsSemesterStatusDialog />
  </div>
</template>
