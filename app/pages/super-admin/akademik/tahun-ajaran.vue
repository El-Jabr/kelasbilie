<script setup lang="ts">
import { useAcademicYears } from '~/composables/useAcademicYears'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Tahun Ajaran'
})

const { fetchAcademicYears } = useAcademicYears()

await fetchAcademicYears()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Tahun Ajaran
      </h1>

      <p class="text-muted text-sm text-gray-500">
        Kelola tahun ajaran sekolah.
      </p>
    </div>

    <AcademicYearsToolbarAcademicYearToolbar />

    <AcademicYearsTableAcademicYearTable />

    <AcademicYearsTableAcademicYearPagination />

    <AcademicYearsDialogsAcademicYearCreateDialog />

    <AcademicYearsDialogsAcademicYearEditDialog />

    <AcademicYearsDialogsAcademicYearDeleteDialog />

    <AcademicYearsDialogsAcademicYearStatusDialog />
  </div>
</template>
