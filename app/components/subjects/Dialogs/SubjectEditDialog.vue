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
  name: '',
  classroomId: undefined
})

watch(
  editDialogOpen,
  (open) => {
    if (!open || !selectedSubject.value) {
      return
    }

    const firstTeaching = (selectedSubject.value as any).teachings?.[0]

    Object.assign(form, {
      code: selectedSubject.value.code || '',
      name: selectedSubject.value.name || '',
      classroomId: firstTeaching?.classroomId || undefined
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateSubject({
    code: form.code.trim(),
    name: form.name.trim(),
    classroomId: form.classroomId || undefined
  })
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Edit Mata Pelajaran</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Ubah informasi mata pelajaran di bawah ini.</p>
            </div>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="-my-1" @click="closeEditDialog" />
          </div>
        </template>

        <UForm
          v-if="editDialogOpen"
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
              @click="closeEditDialog"
            >
              Batal
            </UButton>

            <UButton
              color="primary"
              class="cursor-pointer"
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
