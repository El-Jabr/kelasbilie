export function useTeachingAssignmentDialogs() {
  const selectedAssignment = useState<any | null>(
    'teaching-assignments:selected',
    () => null
  )

  const createDialogOpen = useState(
    'teaching-assignments:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'teaching-assignments:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'teaching-assignments:delete-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(assignment: any) {
    selectedAssignment.value = assignment
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedAssignment.value = null
  }

  function openDeleteDialog(assignment: any) {
    selectedAssignment.value = assignment
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedAssignment.value = null
  }

  return {
    selectedAssignment,
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog
  }
}
