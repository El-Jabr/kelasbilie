<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { fetchTeachers } = useTeachers()
await fetchTeachers()
useSeoMeta({ title: 'Guru' })
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Guru
      </h1><p class="text-muted">
        Kelola data guru sekolah.
      </p>
    </div>
    <TeachersTeacherManager />
  </UContainer>
</template>
