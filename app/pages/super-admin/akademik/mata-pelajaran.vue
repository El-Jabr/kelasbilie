<script setup lang="ts">
import { useSubjects } from '~/composables/useSubjects'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Mata Pelajaran'
})

const { fetchSubjects } = useSubjects()

await fetchSubjects()
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Mata Pelajaran
      </h1>

      <p class="text-muted">
        Kelola data mata pelajaran sekolah.
      </p>
    </div>

    <SubjectsToolbarSubjectToolbar />
    <SubjectsTableSubjectTable />
    <SubjectsTableSubjectPagination />
    <SubjectsDialogsSubjectCreateDialog />
    <SubjectsDialogsSubjectEditDialog />
    <SubjectsDialogsSubjectDeleteDialog />
  </UContainer>
</template>
