import type {
  CreateHomeroomAssignmentSchema,
  UpdateHomeroomAssignmentSchema
} from '~~/shared/schemas/homeroom-assignment'

function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.') {
  if (
    error
    && typeof error === 'object'
  ) {
    const err = error as Record<string, unknown>
    const data = err.data as Record<string, unknown> | undefined
    if (typeof data?.statusMessage === 'string') return data.statusMessage
    if (typeof data?.message === 'string') return data.message
    if (typeof err.statusMessage === 'string') return err.statusMessage
    if (typeof err.message === 'string') return err.message
  }

  return fallback
}

export function useHomeroomActions() {
  const toast = useToast()
  const { refresh } = useHomerooms()

  const {
    selectedHomeroom,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog
  } = useHomeroomDialogs()

  const creating = useState('homerooms:creating', () => false)
  const updating = useState('homerooms:updating', () => false)
  const deleting = useState('homerooms:deleting', () => false)

  async function createHomeroom(data: CreateHomeroomAssignmentSchema) {
    creating.value = true

    try {
      const res = await $fetch<{ message?: string }>('/api/homerooms', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: res.message || 'Wali kelas berhasil ditambahkan.',
        color: 'success'
      })

      closeCreateDialog()
      await refresh()
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Gagal menetapkan wali kelas.')
      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      creating.value = false
    }
  }

  async function updateHomeroom(data: UpdateHomeroomAssignmentSchema) {
    if (!selectedHomeroom.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(`/api/homerooms/${selectedHomeroom.value.id}`, {
        method: 'PATCH',
        body: data
      })

      toast.add({
        title: 'Berhasil Diperbarui',
        description: 'Data wali kelas berhasil diperbarui.',
        color: 'success'
      })

      closeEditDialog()
      await refresh()
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Gagal memperbarui wali kelas.')
      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      updating.value = false
    }
  }

  async function deleteHomeroom() {
    if (!selectedHomeroom.value) {
      return
    }

    deleting.value = true

    try {
      await $fetch(`/api/homerooms/${selectedHomeroom.value.id}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Dihapus',
        description: 'Wali kelas berhasil dihapus.',
        color: 'success'
      })

      closeDeleteDialog()
      await refresh()
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Gagal menghapus penugasan.')
      toast.add({
        title: 'Gagal Menghapus',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      deleting.value = false
    }
  }

  return {
    creating,
    updating,
    deleting,
    createHomeroom,
    updateHomeroom,
    deleteHomeroom
  }
}
