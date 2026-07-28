<script setup lang="ts">
const toast = useToast()
const { editDialogOpen, selectedAssignment, closeEditDialog } = useTeachingAssignmentDialogs()
const { updating, updateTeachingAssignment } = useTeachingAssignmentActions()

const form = reactive({
  teacherId: '',
  subjectId: '',
  classroomId: '',
  semesterId: '',
  courseId: undefined as number | undefined
})

watch(selectedAssignment, (val) => {
  if (val) {
    form.teacherId = val.teacherId || ''
    form.subjectId = val.subjectId || ''
    form.classroomId = val.classroomId || ''
    form.semesterId = val.semesterId || ''
    form.courseId = val.courseId
  }
}, { immediate: true })

async function handleSubmit() {
  if (!form.teacherId || !form.subjectId || !form.classroomId || !form.semesterId || form.courseId === undefined) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Semua field (Guru, Mapel, Kelas, Semester, & Course Moodle) wajib diisi.',
      color: 'error'
    })
    return
  }

  await updateTeachingAssignment({
    ...form,
    courseId: Number(form.courseId)
  })
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              Edit Penugasan Mengajar
            </h2>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="closeEditDialog"
            />
          </div>
        </template>

        <TeachingAssignmentsFormsTeachingAssignmentForm v-model="form" />

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeEditDialog"
            >
              Batal
            </UButton>
            <UButton
              color="primary"
              :loading="updating"
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
