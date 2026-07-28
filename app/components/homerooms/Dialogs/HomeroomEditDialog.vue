<script setup lang="ts">
import { updateHomeroomAssignmentSchema, type CreateHomeroomAssignmentSchema } from '~~/shared/schemas/homeroom-assignment'

const {
  editDialogOpen,
  selectedHomeroom,
  closeEditDialog
} = useHomeroomDialogs()

const {
  updateHomeroom,
  updating
} = useHomeroomActions()

const state = reactive<CreateHomeroomAssignmentSchema>({
  teacherId: '',
  classroomId: '',
  semesterId: ''
})

watch(selectedHomeroom, (homeroom) => {
  if (homeroom) {
    state.teacherId = homeroom.teacherId
    state.classroomId = homeroom.classroomId
    state.semesterId = homeroom.semesterId
  }
})

async function onSubmit() {
  await updateHomeroom(state)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6">
              Edit Wali Kelas
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              class="-my-1"
              @click="closeEditDialog"
            />
          </div>
        </template>

        <UForm
          :schema="updateHomeroomAssignmentSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <HomeroomsFormsHomeroomForm v-model="state" />

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeEditDialog"
            >
              Batal
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="updating"
            >
              Simpan Perubahan
            </UButton>
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>
