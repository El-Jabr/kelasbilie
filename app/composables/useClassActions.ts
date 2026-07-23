import type {
  CreateClassSchema,
  UpdateClassSchema
} from '~~/shared/schemas/class'

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

export function useClassActions() {
  const toast = useToast()

  const { refresh } = useClasses()

  const {
    selectedClass,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog
  } = useClassDialogs()

  const creating = useState(
    'classes:creating',
    () => false
  )

  const updating = useState(
    'classes:updating',
    () => false
  )

  const deleting = useState(
    'classes:deleting',
    () => false
  )

  async function createClass(data: CreateClassSchema) {
    creating.value = true

    try {
      await $fetch('/api/classes', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Kelas berhasil ditambahkan.',
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

  async function updateClass(data: UpdateClassSchema) {
    if (!selectedClass.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(`/api/classes/${selectedClass.value.id}`, {
        method: 'PATCH',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Kelas berhasil diperbarui.',
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

  async function deleteClass() {
    if (!selectedClass.value) {
      return
    }

    deleting.value = true

    try {
      await $fetch(`/api/classes/${selectedClass.value.id}`, {
        method: 'DELETE'
      })

      toast.add({
        title: 'Berhasil',
        description: 'Kelas berhasil dihapus.',
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

    createClass,
    updateClass,
    deleteClass
  }
}
