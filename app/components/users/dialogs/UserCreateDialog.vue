<script setup lang="ts">
import type { UserFormModel } from '../forms/UserForms.vue'


const {
  createDialogOpen,
  closeCreateDialog
} = useUserDialogs()

const {
  creating,
  createUser
} = useUserActions()

const form = reactive<UserFormModel>({
  username: '',
  fullname: '',
  email: '',
  password: '',
  role: 'STUDENT',
  isActive: true
})

watch(createDialogOpen, (open) => {
  if (!open) {
    return
  }

  Object.assign(form, {
    username: '',
    fullname: '',
    email: '',
    password: '',
    role: 'STUDENT',
    isActive: true
  })
})

async function save() {
  await createUser(form)
}
</script>

<template>
  <UModal v-model:open="createDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Tambah User
          </h2>
        </template>

        <UsersFormsUserForms
          v-model="form"
          mode="create"
        />

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
