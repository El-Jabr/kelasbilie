<script setup lang="ts">
import {
  semesterSchema,
  type SemesterSchema
} from '~~/shared/schemas/semester'

const {
  selectedSemester,
  editDialogOpen,
  closeEditDialog
} = useSemesterDialogs()

const {
  updating,
  updateSemester
} = useSemesterActions()

const form = reactive<SemesterSchema>({
  id: '',
  academicYearId: '',
  type: 'GANJIL',
  isActive: false,
  isLocked: false,
  createdAt: '',
  updatedAt: ''
})

watch(
  editDialogOpen,
  (open) => {
    if (!open || !selectedSemester.value) {
      return
    }

    Object.assign(form, {
      academicYearId: selectedSemester.value.academicYear.id,
      type: selectedSemester.value.type,
      isActive: selectedSemester.value.isActive,
      isLocked: selectedSemester.value.isLocked
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateSemester(form)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Edit Semester
          </h2>
        </template>

        <UForm
          :schema="semesterSchema"
          :state="form"
          @submit="save"
        >
          <SemestersFormsSemesterForm
            v-model="form"
            mode="edit"
          />
        </UForm>

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
              :loading="updating"
              @click="save"
            >
              Simpan
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
