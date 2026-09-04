import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'

export function useAcademicYearDialogs() {
  const selectedAcademicYear = useState<AcademicYearSchema | null>(
    'academic-years:selected',
    () => null
  )

  const createDialogOpen = useState(
    'academic-years:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'academic-years:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'academic-years:delete-dialog',
    () => false
  )

  const statusDialogOpen = useState(
    'academic-years:status-dialog',
    () => false
  )

  const lockDialogOpen = useState(
    'academic-years:lock-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(
    academicYear: AcademicYearSchema
  ) {
    selectedAcademicYear.value = academicYear
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedAcademicYear.value = null
  }

  function openDeleteDialog(
    academicYear: AcademicYearSchema
  ) {
    selectedAcademicYear.value = academicYear
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedAcademicYear.value = null
  }

  function openStatusDialog(
    academicYear: AcademicYearSchema
  ) {
    selectedAcademicYear.value = academicYear
    statusDialogOpen.value = true
  }

  function closeStatusDialog() {
    statusDialogOpen.value = false
    selectedAcademicYear.value = null
  }

  function openLockDialog(
    academicYear: AcademicYearSchema
  ) {
    selectedAcademicYear.value = academicYear
    lockDialogOpen.value = true
  }

  function closeLockDialog() {
    lockDialogOpen.value = false
    selectedAcademicYear.value = null
  }

  return {
    selectedAcademicYear,

    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    statusDialogOpen,
    lockDialogOpen,

    openCreateDialog,
    closeCreateDialog,

    openEditDialog,
    closeEditDialog,

    openDeleteDialog,
    closeDeleteDialog,

    openStatusDialog,
    closeStatusDialog,

    openLockDialog,
    closeLockDialog
  }
}
