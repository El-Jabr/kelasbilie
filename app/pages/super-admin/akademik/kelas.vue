<script setup lang="ts">
import { useClasses } from '~/composables/useClasses'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Kelas'
})

const { fetchClasses } = useClasses()

onMounted(() => {
  fetchClasses()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Kelas
      </h1>

      <p class="text-muted text-sm text-gray-500">
        Kelola data kelas sekolah.
      </p>
    </div>

    <ClassesToolbarClassToolbar />

    <ClassesTableClassTable />

    <ClassesTableClassPagination />

    <ClassesDialogsClassCreateDialog />

    <ClassesDialogsClassEditDialog />

    <ClassesDialogsClassDeleteDialog />
  </div>
</template>
