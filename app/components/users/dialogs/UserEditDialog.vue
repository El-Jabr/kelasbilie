<script setup lang="ts">
import {
  userSchema,
  type UserSchema
} from '~~/shared/schemas/user'

const {
  selectedUser,
  editDialogOpen,
  closeEditDialog
} = useUserDialogs()

const {
  updating,
  updateUser
} = useUserActions()

const form = reactive<UserSchema>({
  username: '',
  fullname: '',
  email: '',
  password: '',
  role: 'STUDENT',
  isActive: true
})

watch(
  selectedUser,
  (user) => {
    if (!user) {
      return
    }

    Object.assign(form, {
      username: user.username,
      fullname: user.fullname,
      email: user.email ?? '',
      password: '',
      role: user.role,
      isActive: user.isActive
    })
  },
  {
    immediate: true
  }
)

async function save() {
  await updateUser(form)
}
</script>

<template>
  <UModal v-model:open="editDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Edit User
          </h2>
        </template>

        <UForm
          :schema="userSchema"
          :state="form"
          @submit="save"
        >
          <UsersFormsUserForms
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
