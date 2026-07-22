import type {
  CreateSubjectSchema,
  UpdateSubjectSchema
} from '~~/shared/schemas/subject'

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

export function useSubjectActions() {
  const toast = useToast()
  const { refresh } = useSubjects()

  const {
    selectedSubject,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog
  } = useSubjectDialogs()

  const creating = useState('subjects:creating', () => false)
  const updating = useState('subjects:updating', () => false)
  const deleting = useState('subjects:deleting', () => false)

  async function createSubject(data: CreateSubjectSchema) {
    creating.value = true

    try {
      await $fetch('/api/subjects', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Mata pelajaran berhasil ditambahkan.',
        color: 'success'
      })

      closeCreateDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal',
        description: getErrorMessage(error),
        color: 'error'
      })
    } finally {
      creating.value = false
    }
  }

  async function updateSubject(data: UpdateSubjectSchema) {
    if (!selectedSubject.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(`/api/subjects/${selectedSubject.value.id}`, {
        method: 'PATCH',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Mata pelajaran berhasil diperbarui.',
        color: 'success'
      })

      closeEditDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal',
        description: getErrorMessage(error),
        color: 'error'
      })
    } finally {
      updating.value = false
    }
  }

  async function deleteSubject() {
    if (!selectedSubject.value) {
      return
    }

    deleting.value = true

    try {
      await $fetch(`/api/subjects/${selectedSubject.value.id}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Berhasil',
        description: 'Mata pelajaran berhasil dihapus.',
        color: 'success'
      })

      closeDeleteDialog()
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Gagal',
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
    createSubject,
    updateSubject,
    deleteSubject
  }
}
