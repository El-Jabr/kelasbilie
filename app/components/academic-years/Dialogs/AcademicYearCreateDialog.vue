<script setup lang="ts">
import {
  academicYearSchema,
  type AcademicYearSchema
} from '~~/shared/schemas/academic-year'

const {
  createDialogOpen,
  closeCreateDialog
} = useAcademicYearDialogs()

const {
  creating,
  createAcademicYear
} = useAcademicYearActions()

const form = reactive<AcademicYearSchema>({
  name: '',
  isActive: false,
  isLocked: false,
  id: '',
  createdAt: ''
})

watch(createDialogOpen, (open) => {
  if (!open) {
    return
  }

  Object.assign(form, {
    name: '',
    isActive: false,
    isLocked: false
  })
})

async function save() {
  await createAcademicYear(form)
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Tambah Tahun Ajaran
          </h2>
        </template>

        <UForm
          :schema="academicYearSchema"
          :state="form"
          @submit="save"
        >
          <AcademicYearsFormsAcademicYearForms
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
