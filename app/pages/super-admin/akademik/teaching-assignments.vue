<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Penugasan Mengajar'
})

const { fetchTeachingAssignments } = useTeachingAssignments()
const { openCreateDialog } = useTeachingAssignmentDialogs()

onMounted(() => {
  fetchTeachingAssignments()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Penugasan Mengajar (TeachingAssignment)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Penetapan guru pengampu mata pelajaran di kelas dan pemetaan ke Course Moodle.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateDialog"
      >
        Tambah Penugasan
      </UButton>
    </div>

    <!-- Data Table Card -->
    <TeachingAssignmentsTableTeachingAssignmentTable />

    <!-- Dialogs -->
    <TeachingAssignmentsDialogsTeachingAssignmentCreateDialog />
    <TeachingAssignmentsDialogsTeachingAssignmentEditDialog />
  </div>
</template>
