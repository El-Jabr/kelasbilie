<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { fetchStudents } = useStudents()
await fetchStudents()
useSeoMeta({ title: 'Siswa' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Siswa
      </h1>
      <p class="text-muted text-sm text-gray-500">
        Kelola data siswa sekolah.
      </p>
    </div>
    <StudentsStudentManager />
  </div>
</template>
