import type { CreateSemesterSchema, UpdateSemesterSchema } from '~~/shared/schemas/semester'

export function useSemesterActions() {
  const toast = useToast()

  const { refresh } = useSemesters()

  const {
    selectedSemester,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    closeStatusDialog
  } = useSemesterDialogs()

  const creating = useState(
    'semesters:creating',
    () => false
  )

  const updating = useState(
    'semesters:updating',
    () => false
  )

  const updatingStatus = useState(
    'semesters:updating-status',
    () => false
  )

  const deleting = useState(
    'semesters:deleting',
    () => false
  )

  async function createSemester(
    data: CreateSemesterSchema
  ) {
    creating.value = true

    try {
      await $fetch('/api/semesters', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Semester berhasil ditambahkan.',
        color: 'success'
      })

      closeCreateDialog()

      await refresh()
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

  async function updateSemester(
    data: UpdateSemesterSchema
  ) {
    if (!selectedSemester.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(
        `/api/semesters/${selectedSemester.value.id}`,
        {
          method: 'PATCH',
          body: data
        }
      )

      toast.add({
        title: 'Berhasil',
        description: 'Semester berhasil diperbarui.',
        color: 'success'
      })

      closeEditDialog()

      await refresh()
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
    if (!selectedSemester.value) {
      return
    }

    updatingStatus.value = true

    try {
      await $fetch(
        `/api/semesters/${selectedSemester.value.id}`,
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
          ? 'Semester berhasil diaktifkan.'
          : 'Semester berhasil dinonaktifkan.',
        color: 'success'
      })

      closeStatusDialog()

      await refresh()
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.statusMessage ?? 'Terjadi kesalahan.',
        color: 'error'
      })
    } finally {
      updatingStatus.value = false
    }
  }

  async function deleteSemester() {
    if (!selectedSemester.value) {
      return
    }

    deleting.value = true

    try {
      await $fetch(
        `/api/semesters/${selectedSemester.value.id}`,
        {
          method: 'DELETE'
        }
      )

      toast.add({
        title: 'Berhasil',
        description: 'Semester berhasil dihapus.',
        color: 'success'
      })

      closeDeleteDialog()

      await refresh()
    } catch (error: any) {
      toast.add({
        title: 'Gagal',
        description: error.statusMessage ?? 'Terjadi kesalahan.',
        color: 'error'
      })
    } finally {
      deleting.value = false
    }
  }

  return {
    creating,
    updating,
    updatingStatus,
    deleting,

    createSemester,
    updateSemester,
    updateStatus,
    deleteSemester
  }
}
