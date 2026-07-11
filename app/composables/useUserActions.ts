import type { UserFormModel } from "~/components/users/forms/UserForms.vue"

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

export function useUserActions() {
  const toast = useToast()

  const { refresh } = useUsers()

  const {
    selectedUser,
    closeCreateDialog,
    closeEditDialog,
    closeRoleDialog,
    closeStatusDialog
  } = useUserDialogs()

  const updatingRole = useState(
    'users:action-loading',
    () => false
  )

  const creating = useState('users:creating', () => false)

  const updating = useState('users:updating', () => false)

  const updatingStatus = useState('users:updating-status', () => false)

  async function createUser(
    data: UserFormModel
  ) {
    creating.value = true
    try {
      await $fetch('/api/users', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'User berhasil ditambahkan.',
        color: 'success'
      })

      closeCreateDialog()

      await refresh()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.statusMessage ?? 'Terjadi kesalahan.',
        color: 'error'
      })
    } finally {
      creating.value = false
    }
  }
  async function updateUser(
    data: UserFormModel
  ) {
    if (!selectedUser.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(`/api/users/${selectedUser.value.id}`, {
        method: 'PUT',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'User berhasil diperbarui.',
        color: 'success'
      })

      closeEditDialog()

      await refresh()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.statusMessage ?? 'Terjadi kesalahan.',
        color: 'error'
      })
    } finally {
      updating.value = false
    }
  }
  async function updateStatus(
    isActive: boolean
  ) {
    if (!selectedUser.value) {
    return
  }

  updatingStatus.value = true

  try {
    await $fetch(
      `/api/users/${selectedUser.value.id}/status`,
      {
        method: 'PATCH',
        body: {
          isActive
        }
      }
    )

    toast.add({
      title: 'Berhasil',
      description: isActive
        ? 'User berhasil diaktifkan.'
        : 'User berhasil dinonaktifkan.',
      color: 'success'
    })

    closeStatusDialog()

    await refresh()
  }
  catch (error: any) {
    toast.add({
      title: 'Gagal',
      description:
        error.statusMessage ??
        'Terjadi kesalahan.',
      color: 'error'
    })
  }
  finally {
    updatingStatus.value = false
  }

  }

  async function updateRole(role: Role) {
    if (!selectedUser.value) {
      return
    }

    updatingRole.value = true

    try {
      await $fetch(
        `/api/users/${selectedUser.value.id}/role`,
        {
          method: 'PATCH',
          body: {
            role
          }
        }
      )

      toast.add({
        title: 'Berhasil',
        description: 'Role berhasil diperbarui.',
        color: 'success'
      })

      closeRoleDialog()

      await refresh()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.statusMessage ?? 'Terjadi kesalahan.',
        color: 'error'
      })
    } finally {
      updatingRole.value = false
    }
  }

  return {
    creating,
    updating,
    updatingRole,
    updatingStatus,

    createUser,
    updateUser,
    updateRole,
    updateStatus
  }
}
