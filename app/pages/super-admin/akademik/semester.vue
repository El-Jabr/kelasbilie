<script setup lang="ts">
import { useSemesters } from '~/composables/useSemesters'

useSeoMeta({
  title: 'Semester'
})

const { fetchSemesters } = useSemesters()

await fetchSemesters()
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Semester
      </h1>

      <p class="text-muted">
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
  </UContainer>
</template>
