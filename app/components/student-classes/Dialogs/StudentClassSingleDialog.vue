<script setup lang="ts">
const { studentOptions, classOptions, semesterOptions, semesters } = useStudentClasses()
const { isSingleModalOpen, editingId, selectedStudentClass, closeSingleModal } = useStudentClassDialogs()
const { isSingleSubmitting, handleSingleSubmit } = useStudentClassActions()

const singleForm = reactive({
  studentId: '',
  classroomId: '',
  semesterId: ''
})

watch(isSingleModalOpen, (open) => {
  if (open) {
    if (selectedStudentClass.value) {
      singleForm.studentId = selectedStudentClass.value.studentId
      singleForm.classroomId = selectedStudentClass.value.classroomId
      singleForm.semesterId = selectedStudentClass.value.semesterId
    } else {
      singleForm.studentId = ''
      singleForm.classroomId = ''
      const activeSem = semesters.value.find((s: any) => s.isActive)?.id
      singleForm.semesterId = activeSem || semesters.value[0]?.id || ''
    }
  }
})

async function onSubmit() {
  await handleSingleSubmit(singleForm)
}
</script>

<template>
  <UModal v-model:open="isSingleModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              {{ editingId ? 'Edit Pendaftaran Kelas Siswa' : 'Daftarkan 1 Siswa ke Kelas' }}
            </h2>
            <UButton
              type="button"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              @click="closeSingleModal"
            />
          </div>
        </template>

        <form @submit.prevent="onSubmit">
          <div class="space-y-4">
            <UFormField label="Siswa" required>
              <USelect
                v-model="singleForm.studentId"
                :items="studentOptions"
                value-key="value"
                label-key="label"
                placeholder="-- Pilih Siswa --"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Kelas Target" required>
              <USelect
                v-model="singleForm.classroomId"
                :items="classOptions"
                value-key="value"
                label-key="label"
                placeholder="-- Pilih Kelas --"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Semester Target" required>
              <USelect
                v-model="singleForm.semesterId"
                :items="semesterOptions"
                value-key="value"
                label-key="label"
                placeholder="-- Pilih Semester --"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2 pt-6">
            <UButton
              type="button"
              color="neutral"
              variant="soft"
              class="cursor-pointer"
              @click="closeSingleModal"
            >
              Batal
            </UButton>

            <UButton
              type="submit"
              color="primary"
              class="cursor-pointer"
              :loading="isSingleSubmitting"
            >
              Simpan
            </UButton>
          </div>
        </form>
      </UCard>
    </template>
  </UModal>
</template>
