<script setup lang="ts">
import {
  createClassSchema,
  type CreateClassSchema
} from '~~/shared/schemas/class'

const {
  selectedClass,
  editDialogOpen,
  closeEditDialog
} = useClassDialogs()

const {
  updating,
  updateClass
} = useClassActions()

const form = reactive<CreateClassSchema>({
  name: '',
  level: 0,
  room: '',
  building: '',
  floor: 0,
  createdAt: '',
  updatedAt: ''

})

watch(
  editDialogOpen,
  (open) => {
    if (!open || !selectedClass.value) {
      return
    }

    Object.assign(form, {
      name: selectedClass.value.name,
      level: selectedClass.value.level,
      room: selectedClass.value.room,
      building: selectedClass.value.building,
      floor: selectedClass.value.floor
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateClass(form)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Edit Kelas
          </h2>
        </template>

        <UForm
          :schema="createClassSchema"
          :state="form"
          @submit="save"
        >
          <ClassesFormsClassForm v-model="form" />
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
