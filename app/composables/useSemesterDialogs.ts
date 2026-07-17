import type { SemesterTableSchema } from '~~/shared/schemas/semester'

export function useSemesterDialogs() {
  const selectedSemester = useState<SemesterTableSchema | null>(
    'semesters:selected',
    () => null
  )

  const createDialogOpen = useState(
    'semesters:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'semesters:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'semesters:delete-dialog',
    () => false
  )

  const statusDialogOpen = useState(
    'semesters:status-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(
    semester: SemesterTableSchema
  ) {
    selectedSemester.value = semester
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedSemester.value = null
  }

  function openDeleteDialog(
    semester: SemesterTableSchema
  ) {
    selectedSemester.value = semester
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedSemester.value = null
  }

  function openStatusDialog(
    semester: SemesterTableSchema
  ) {
    selectedSemester.value = semester
    statusDialogOpen.value = true
  }

  function closeStatusDialog() {
    statusDialogOpen.value = false
    selectedSemester.value = null
  }

  return {
    selectedSemester,

    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    statusDialogOpen,

    openCreateDialog,
    closeCreateDialog,

    openEditDialog,
    closeEditDialog,

    openDeleteDialog,
    closeDeleteDialog,

    openStatusDialog,
    closeStatusDialog
  }
}
