<script setup lang="ts">
import {
  createSubjectSchema,
  type CreateSubjectSchema
} from '~~/shared/schemas/subject'

const {
  selectedSubject,
  editDialogOpen,
  closeEditDialog
} = useSubjectDialogs()

const {
  updating,
  updateSubject
} = useSubjectActions()

const form = reactive<CreateSubjectSchema>({
  code: '',
  name: ''
})

watch(
  editDialogOpen,
  (open) => {
    if (!open || !selectedSubject.value) {
      return
    }

    Object.assign(form, {
      code: selectedSubject.value.code,
      name: selectedSubject.value.name
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateSubject(form)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Edit Mata Pelajaran
          </h2>
        </template>

        <UForm
          :schema="createSubjectSchema"
          :state="form"
          @submit="save"
        >
          <SubjectsFormsSubjectForm v-model="form" />
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
