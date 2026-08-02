<script setup lang="ts">
import { useSubjects } from '~/composables/useSubjects'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Mata Pelajaran'
})

const { fetchSubjects } = useSubjects()

onMounted(() => {
  fetchSubjects()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Mata Pelajaran
      </h1>

      <p class="text-muted text-sm text-gray-500">
        Kelola data mata pelajaran sekolah.
      </p>
    </div>

    <SubjectsToolbarSubjectToolbar />
    <SubjectsTableSubjectTable />
    <SubjectsTableSubjectPagination />
    <SubjectsDialogsSubjectCreateDialog />
    <SubjectsDialogsSubjectEditDialog />
    <SubjectsDialogsSubjectDeleteDialog />
  </div>
</template>
