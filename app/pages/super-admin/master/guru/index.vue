<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { teachers, fetchTeachers } = useTeachers()
onMounted(() => {
  if (teachers.value.length === 0) fetchTeachers()
})
useSeoMeta({ title: 'Guru' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Guru
      </h1>
      <p class="text-muted text-sm text-gray-500">
        Kelola data guru sekolah.
      </p>
    </div>
    <TeachersTeacherManager />
  </div>
</template>
