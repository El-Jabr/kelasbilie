<script setup lang="ts">
const { fetchStudents } = useStudents()
await fetchStudents()
useSeoMeta({ title: 'Siswa' })
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Siswa
      </h1><p class="text-muted">
        Kelola data siswa sekolah.
      </p>
    </div>
    <StudentsStudentManager />
  </UContainer>
</template>
