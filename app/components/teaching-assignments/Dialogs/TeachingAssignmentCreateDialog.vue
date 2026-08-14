<script setup lang="ts">
const toast = useToast()
const { semesters } = useTeachingAssignments()
const { createDialogOpen, closeCreateDialog } = useTeachingAssignmentDialogs()
const { creating, createTeachingAssignment } = useTeachingAssignmentActions()

const form = reactive({
  teacherId: '',
  subjectId: '',
  classroomId: '',
  semesterId: '',
  courseId: undefined as number | undefined
})

watch(createDialogOpen, (open) => {
  if (open) {
    form.teacherId = ''
    form.subjectId = ''
    form.classroomId = ''
    form.semesterId = semesters.value.find((s: { isActive?: boolean, id?: string }) => s.isActive)?.id || ''
    form.courseId = undefined
  }
})

async function handleSubmit() {
  if (!form.teacherId || !form.subjectId || !form.classroomId || !form.semesterId || form.courseId === undefined) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Semua field (Guru, Mapel, Kelas, Semester, & Course Moodle) wajib diisi.',
      color: 'error'
    })
    return
  }

  await createTeachingAssignment({
    ...form,
    courseId: Number(form.courseId)
  })
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              Tambah Penugasan Mengajar
            </h2>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="closeCreateDialog"
            />
          </div>
        </template>

        <TeachingAssignmentsFormsTeachingAssignmentForm v-model="form" />

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeCreateDialog"
            >
              Batal
            </UButton>
            <UButton
              color="primary"
              :loading="creating"
              @click="handleSubmit"
            >
              Simpan
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
