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
  name: '',
  classroomId: undefined
})

watch(createDialogOpen, (open) => {
  if (open) {
    Object.assign(form, {
      code: '',
      name: '',
      classroomId: undefined
    })
  }
})

async function save() {
  await createSubject({
    code: form.code.trim(),
    name: form.name.trim(),
    classroomId: form.classroomId || undefined
  })
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Tambah Mata Pelajaran</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Isi form di bawah untuk membuat mata pelajaran baru.</p>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="-my-1" @click="closeCreateDialog" />
          </div>
        </template>

        <UForm
          v-if="createDialogOpen"
          :schema="createSubjectSchema"
          :state="form"
          class="space-y-4"
          @submit="save"
        >
          <SubjectsFormsSubjectForm :model-value="form" @update:model-value="Object.assign(form, $event)" />
        </UForm>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              class="cursor-pointer"
              @click="closeCreateDialog"
            >
              Batal
            </UButton>

            <UButton
              color="primary"
              class="cursor-pointer"
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
