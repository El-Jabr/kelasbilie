<script setup lang="ts">
import {
  createSemesterSchema,
  type SemesterSchema
} from '~~/shared/schemas/semester'

const {
  createDialogOpen,
  closeCreateDialog
} = useSemesterDialogs()

const {
  creating,
  createSemester
} = useSemesterActions()

const form = reactive<SemesterSchema>({
  academicYearId: '',
  type: 'GANJIL',
  isActive: false,
  isLocked: false,
  id: '',
  createdAt: '',
  updatedAt: '',
  academicYear: {
    id: '',
    name: ''
  }
})

watch(createDialogOpen, (open) => {
  if (!open) {
    return
  }

  Object.assign(form, {
    academicYearId: '',
    type: 'GANJIL',
    isActive: false,
    isLocked: false
  })
})

async function save() {
  await createSemester(form)
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Tambah Semester
          </h2>
        </template>

        <UForm
          :schema="createSemesterSchema"
          :state="form"
          @submit="save"
        >
          <SemestersFormsSemesterForm
            v-model="form"
            mode="create"
          />
        </UForm>

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
              :loading="creating"
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
