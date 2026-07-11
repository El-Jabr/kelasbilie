<script setup lang="ts">
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface UserFormModel {
  username: string
  fullname: string
  email: string
  password: string
  role: Role
  isActive: boolean
}

const {
  selectedUser
} = useUsers()

const { mode } = defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<UserFormModel>({
  required: true
})

</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Username"
      required
    >
      <UInput
        v-model="model.username"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Nama Lengkap"
      required
    >
      <UInput
        v-model="model.fullname"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Email"
    >
      <UInput
        v-model="model.email"
        type="email"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="mode === 'create'
        ? 'Password'
        : 'Password Baru'"
      :required="mode === 'create'"
      :description="mode === 'edit'
        ? 'Kosongkan jika password tidak ingin diubah.'
        : undefined"
    >
      <UInput
        v-model="model.password"
        type="password"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Role"
      required
    >
      <UsersBadgesUserRoleBadge :role="selectedUser?.role ?? model.role" />
    </UFormField>

    <!-- <UFormField
      v-if="mode === 'edit'"
      label="Status"
    >
      <USwitch
        v-model="model.isActive"
      />
    </UFormField> -->
  </div>
</template>
