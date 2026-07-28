function getErrorMessage(error: unknown) {
  if (
    error
    && typeof error === 'object'
    && 'data' in error
    && error.data
    && typeof error.data === 'object'
    && 'statusMessage' in error.data
    && typeof error.data.statusMessage === 'string'
  ) {
    return error.data.statusMessage
  }
  if (
    error
    && typeof error === 'object'
    && 'message' in error
    && typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Terjadi kesalahan.'
}

export function useTeachingAssignmentActions() {
  const toast = useToast()
  const { refresh } = useTeachingAssignments()

  const {
    selectedAssignment,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog
  } = useTeachingAssignmentDialogs()

  const creating = useState('teaching-assignments:creating', () => false)
  const updating = useState('teaching-assignments:updating', () => false)
  const deleting = useState('teaching-assignments:deleting', () => false)

  async function createTeachingAssignment(payload: any) {
    creating.value = true

    try {
      const res: any = await $fetch('/api/teaching-assignments', {
        method: 'POST',
        body: payload
      })

      toast.add({
        title: 'Berhasil Ditambahkan',
        description: res?.message || 'Penugasan mengajar berhasil disimpan.',
        color: 'success'
      })

      closeCreateDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal Menyimpan',
        description: getErrorMessage(error),
        color: 'error'
      })
    } finally {
      creating.value = false
    }
  }

  async function updateTeachingAssignment(payload: any) {
    if (!selectedAssignment.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(`/api/teaching-assignments/${selectedAssignment.value.id}`, {
        method: 'PATCH',
        body: payload
      })

      toast.add({
        title: 'Berhasil Diperbarui',
        description: 'Data penugasan mengajar berhasil diperbarui.',
        color: 'success'
      })

      closeEditDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal Menyimpan',
        description: getErrorMessage(error),
        color: 'error'
      })
    } finally {
      updating.value = false
    }
  }

  async function deleteTeachingAssignment(id?: string) {
    const targetId = id || selectedAssignment.value?.id
    if (!targetId) {
      return
    }

    deleting.value = true

    try {
      await $fetch(`/api/teaching-assignments/${targetId}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Dihapus',
        description: 'Penugasan mengajar berhasil dihapus.',
        color: 'success'
      })

      closeDeleteDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal Menghapus',
        description: getErrorMessage(error),
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
    createTeachingAssignment,
    updateTeachingAssignment,
    deleteTeachingAssignment
  }
}
