<script setup lang="ts">
import { createHomeroomAssignmentSchema, type CreateHomeroomAssignmentSchema } from '~~/shared/schemas/homeroom-assignment'

const {
  createDialogOpen,
  closeCreateDialog
} = useHomeroomDialogs()

const {
  createHomeroom,
  creating
} = useHomeroomActions()

const state = reactive<CreateHomeroomAssignmentSchema>({
  teacherId: '',
  classroomId: '',
  semesterId: ''
})

async function onSubmit() {
  await createHomeroom(state)
}

watch(createDialogOpen, (isOpen) => {
  if (!isOpen) {
    state.teacherId = ''
    state.classroomId = ''
    state.semesterId = ''
  }
})
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6">
              Assign Wali Kelas
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              class="-my-1"
              @click="closeCreateDialog"
            />
          </div>
        </template>

        <UForm
          :schema="createHomeroomAssignmentSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <HomeroomsFormsHomeroomForm v-model="state" />

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeCreateDialog"
            >
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="creating"
            >
              Simpan
            </UButton>
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
