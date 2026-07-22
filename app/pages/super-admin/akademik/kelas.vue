<script setup lang="ts">
import { useClasses } from '~/composables/useClasses'

useSeoMeta({
  title: 'Kelas'
})

const { fetchClasses } = useClasses()

await fetchClasses()
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Kelas
      </h1>

      <p class="text-muted">
        Kelola data kelas sekolah.
      </p>
    </div>

    <ClassesToolbarClassToolbar />

    <ClassesTableClassTable />

    <ClassesTableClassPagination />

    <ClassesDialogsClassCreateDialog />

    <ClassesDialogsClassEditDialog />

    <ClassesDialogsClassDeleteDialog />
  </UContainer>
</template>
