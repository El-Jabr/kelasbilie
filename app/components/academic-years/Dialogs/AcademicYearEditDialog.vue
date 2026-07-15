<script setup lang="ts">
import {
  academicYearSchema,
  type AcademicYearSchema
} from '~~/shared/schemas/academic-year'

const {
  selectedAcademicYear,
  editDialogOpen,
  closeEditDialog
} = useAcademicYearDialogs()

const {
  updating,
  updateAcademicYear
} = useAcademicYearActions()

const form = reactive<AcademicYearSchema>({
  name: '',
  isActive: false,
  isLocked: false,
  id: '',
  createdAt: ''
})

watch(
  editDialogOpen,
  (open) => {
    if (!open || !selectedAcademicYear.value) {
      return
    }

    Object.assign(form, {
      name: selectedAcademicYear.value.name,
      isActive: selectedAcademicYear.value.isActive,
      isLocked: selectedAcademicYear.value.isLocked
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateAcademicYear(form)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Edit Tahun Ajaran
          </h2>
        </template>

        <UForm
          :schema="academicYearSchema"
          :state="form"
          @submit="save"
        >
          <AcademicYearsFormsAcademicYearForms
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
