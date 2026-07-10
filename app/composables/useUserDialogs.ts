import type { UserItem } from './useUsers'

export function useUserDialogs() {
  const selectedUser = useState<UserItem | null>(
    'users:selected-user',
    () => null
  )

  const roleDialogOpen = useState(
    'users:role-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'users:edit-dialog',
    () => false
  )

  const createDialogOpen = useState(
    'users:create-dialog',
    () => false
  )

  const statusDialogOpen = useState(
    'users:status-dialog',
    () => false
  )

  const resetPasswordDialogOpen = useState(
    'users:reset-password-dialog',
    () => false
  )

  function openRoleDialog(user: UserItem) {
    selectedUser.value = user
    roleDialogOpen.value = true
  }

  function closeRoleDialog() {
    roleDialogOpen.value = false
    selectedUser.value = null
  }

  function openEditDialog(user: UserItem) {
    selectedUser.value = user
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedUser.value = null
  }

  function openCreateDialog() {
    selectedUser.value = null
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openStatusDialog(user: UserItem) {
    selectedUser.value = user
    statusDialogOpen.value = true
  }

  function closeStatusDialog() {
    statusDialogOpen.value = false
    selectedUser.value = null
  }

  function openResetPasswordDialog(user: UserItem) {
    selectedUser.value = user
    resetPasswordDialogOpen.value = true
  }

  function closeResetPasswordDialog() {
    resetPasswordDialogOpen.value = false
    selectedUser.value = null
  }

  return {
    selectedUser,

    roleDialogOpen,
    editDialogOpen,
    createDialogOpen,
    statusDialogOpen,
    resetPasswordDialogOpen,

    openRoleDialog,
    closeRoleDialog,

    openEditDialog,
    closeEditDialog,

    openCreateDialog,
    closeCreateDialog,

    openStatusDialog,
    closeStatusDialog,

    openResetPasswordDialog,
    closeResetPasswordDialog
  }
}
