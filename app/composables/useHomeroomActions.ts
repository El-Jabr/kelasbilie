import type {
  CreateHomeroomAssignmentSchema,
  UpdateHomeroomAssignmentSchema
} from '~~/shared/schemas/homeroom-assignment'

function getErrorMessage(error: unknown) {
  if (
    error
    && typeof error === 'object'
    && 'statusMessage' in error
    && typeof error.statusMessage === 'string'
  ) {
    return error.statusMessage
  }

  return 'Terjadi kesalahan.'
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
      const res: any = await $fetch('/api/homerooms', {
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
    } catch (error: any) {
      const errorMsg = error.data?.statusMessage || error.data?.message || error.statusMessage || error.message || 'Gagal menetapkan wali kelas.'
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
    } catch (error: any) {
      const errorMsg = error.data?.statusMessage || error.data?.message || error.statusMessage || error.message || 'Gagal memperbarui wali kelas.'
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
    } catch (error: any) {
      const errorMsg = error.data?.statusMessage || error.data?.message || error.statusMessage || error.message || 'Gagal menghapus penugasan.'
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
