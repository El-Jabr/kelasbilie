<script setup lang="ts">
import type { UserItem } from '~/composables/useUsers'
import type { DropdownMenuItem } from '@nuxt/ui'

const { user } = defineProps<{
  user: UserItem
}>()

const {
  openRoleDialog,
  openEditDialog,
  openStatusDialog
  // openResetPasswordDialog
} = useUserDialogs()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit User',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditDialog(user)
      }
    },
    {
      label: 'Ubah Role',
      icon: 'i-lucide-shield',
      onSelect: () => {
        openRoleDialog(user)
      }
    },
    {
      label: 'Reset Password',
      icon: 'i-lucide-key-round',
      onSelect: () => {
        // STEP berikutnya
      }
    }
  ],
  [
    {
      label: user.isActive
        ? 'Nonaktifkan'
        : 'Aktifkan',

      icon: user.isActive
        ? 'i-lucide-user-x'
        : 'i-lucide-user-check',

      color: user.isActive
        ? 'error'
        : 'success',

      onSelect: () => {
        openStatusDialog(user)
      }
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
  >
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
