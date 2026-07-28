export function useHomeroomDialogs() {
  const selectedHomeroom = useState<any | null>(
    'homerooms:selected',
    () => null
  )

  const createDialogOpen = useState(
    'homerooms:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'homerooms:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'homerooms:delete-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(homeroom: any) {
    selectedHomeroom.value = homeroom
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedHomeroom.value = null
  }

  function openDeleteDialog(homeroom: any) {
    selectedHomeroom.value = homeroom
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedHomeroom.value = null
  }

  return {
    selectedHomeroom,
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
