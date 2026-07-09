<script setup lang="ts">
const {
  selectedUser,
  roleDialogOpen,
  closeRoleDialog,
  updateRole
} = useUsers()

const role = ref<'ADMIN' | 'TEACHER' | 'STUDENT'>('STUDENT')

watch(
  selectedUser,
  (user) => {
    role.value = user?.role ?? 'STUDENT'
  },
  {
    immediate: true
  }
)

const roleOptions = [
  {
    label: 'Admin',
    value: 'ADMIN'
  },
  {
    label: 'Teacher',
    value: 'TEACHER'
  },
  {
    label: 'Student',
    value: 'STUDENT'
  }
]

async function save() {
  await updateRole(role.value)
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

          <UInput
            :model-value="selectedUser.fullname"
            disabled
          />

          <USelect
            v-model="role"
            :items="roleOptions"
          />

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

            <UButton @click="save">
              Simpan
            </UButton>

          </div>

        </template>

      </UCard>
    </template>
  </UModal>
</template>
