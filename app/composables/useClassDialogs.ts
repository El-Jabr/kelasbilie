import type { ClassSchema } from '~~/shared/schemas/class'

export function useClassDialogs() {
  const selectedClass = useState<ClassSchema | null>(
    'classes:selected',
    () => null
  )

  const createDialogOpen = useState(
    'classes:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'classes:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'classes:delete-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(classroom: ClassSchema) {
    selectedClass.value = classroom
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedClass.value = null
  }

  function openDeleteDialog(classroom: ClassSchema) {
    selectedClass.value = classroom
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedClass.value = null
  }

  return {
    selectedClass,

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
