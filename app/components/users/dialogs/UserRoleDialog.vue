<script setup lang="ts">
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'
const {
  selectedUser,
  roleDialogOpen,
  closeRoleDialog
} = useUserDialogs()

const {
  updatingRole,
  updateRole
} = useUserActions()

const role = ref<Role>('STUDENT')

const roles = [
  { label: 'Admin', value: 'ADMIN' as Role },
  { label: 'Teacher', value: 'TEACHER' as Role },
  { label: 'Student', value: 'STUDENT' as Role }
]

watch(
  selectedUser,
  (user) => {
    role.value = user?.role ?? 'STUDENT'
  },
  { immediate: true }
)

async function save() {
  if (!role.value) return

  await updateRole(
    role.value
  )
}
</script>

<template>
  <UModal v-model:open="roleDialogOpen">
    <template #content>
      <UCard v-if="selectedUser">
        <template #header>
          <h2 class="font-semibold">
            Ubah Role
          </h2>
        </template>

        <div class="space-y-4">
          <UFormField label="Nama Lengkap">
            <UInput
              :model-value="selectedUser.fullname"
              disabled
            />
          </UFormField>

          <UFormField label="Role">
            <USelect
              v-model="role"
              :items="roles"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeRoleDialog"
            >
              Batal
            </UButton>

            <UButton
              :loading="updatingRole"
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
