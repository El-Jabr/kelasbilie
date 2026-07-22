<script setup lang="ts">
import {
  createClassSchema,
  type CreateClassSchema
} from '~~/shared/schemas/class'

const {
  createDialogOpen,
  closeCreateDialog
} = useClassDialogs()

const {
  creating,
  createClass
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

watch(createDialogOpen, (open) => {
  if (!open) {
    return
  }

  Object.assign(form, {
    name: '',
    level: 0
  })
})

async function save() {
  await createClass(form)
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Tambah Kelas
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
