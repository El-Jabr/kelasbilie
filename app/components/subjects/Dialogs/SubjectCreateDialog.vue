<script setup lang="ts">
import {
  createSubjectSchema,
  type CreateSubjectSchema
} from '~~/shared/schemas/subject'

const {
  createDialogOpen,
  closeCreateDialog
} = useSubjectDialogs()

const {
  creating,
  createSubject
} = useSubjectActions()

const form = reactive<CreateSubjectSchema>({
  code: '',
  name: ''
})

watch(createDialogOpen, (open) => {
  if (open) {
    Object.assign(form, {
      code: '',
      name: ''
    })
  }
})

async function save() {
  await createSubject(form)
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Tambah Mata Pelajaran
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
