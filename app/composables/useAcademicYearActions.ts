import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'

export function useAcademicYearActions() {
  const toast = useToast()

  const { refresh } = useAcademicYears()

  const {
    selectedAcademicYear,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
    closeStatusDialog
  } = useAcademicYearDialogs()

  const creating = useState(
    'academic-years:creating',
    () => false
  )

  const updating = useState(
    'academic-years:updating',
    () => false
  )

  const updatingStatus = useState(
    'academic-years:updating-status',
    () => false
  )

  const deleting = useState(
    'academic-years:deleting',
    () => false
  )

  async function createAcademicYear(
    data: AcademicYearSchema
  ) {
    creating.value = true

    try {
      await $fetch('/api/academic-years', {
        method: 'POST',
        body: data
      })

      toast.add({
        title: 'Berhasil',
        description: 'Tahun ajaran berhasil ditambahkan.',
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

  async function updateAcademicYear(
    data: AcademicYearSchema
  ) {
    if (!selectedAcademicYear.value) {
      return
    }

    updating.value = true

    try {
      await $fetch(
        `/api/academic-years/${selectedAcademicYear.value.id}`,
        {
          method: 'PUT',
          body: data
        }
      )

      toast.add({
        title: 'Berhasil',
        description: 'Tahun ajaran berhasil diperbarui.',
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
    if (!selectedAcademicYear.value) {
      return
    }

    updatingStatus.value = true

    try {
      await $fetch(
        `/api/academic-years/${selectedAcademicYear.value.id}/status`,
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
          ? 'Tahun ajaran berhasil diaktifkan.'
          : 'Tahun ajaran berhasil dinonaktifkan.',
        color: 'success'
      })

      closeStatusDialog()

      await refresh()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async function deleteAcademicYear() {
    if (!selectedAcademicYear.value) {
      return
    }

    deleting.value = true

    try {
      await $fetch(
        `/api/academic-years/${selectedAcademicYear.value.id}`,
        {
          method: 'DELETE'
        }
      )

      toast.add({
        title: 'Berhasil',
        description: 'Tahun ajaran berhasil dihapus.',
        color: 'success'
      })

      closeDeleteDialog()

      await refresh()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    createAcademicYear,
    updateAcademicYear,
    updateStatus,
    deleteAcademicYear
  }
}
