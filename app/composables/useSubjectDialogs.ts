import type { SubjectSchema } from '~~/shared/schemas/subject'

export function useSubjectDialogs() {
  const selectedSubject = useState<SubjectSchema | null>(
    'subjects:selected',
    () => null
  )

  const createDialogOpen = useState(
    'subjects:create-dialog',
    () => false
  )

  const editDialogOpen = useState(
    'subjects:edit-dialog',
    () => false
  )

  const deleteDialogOpen = useState(
    'subjects:delete-dialog',
    () => false
  )

  function openCreateDialog() {
    createDialogOpen.value = true
  }

  function closeCreateDialog() {
    createDialogOpen.value = false
  }

  function openEditDialog(subject: SubjectSchema) {
    selectedSubject.value = subject
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedSubject.value = null
  }

  function openDeleteDialog(subject: SubjectSchema) {
    selectedSubject.value = subject
    deleteDialogOpen.value = true
  }

  function closeDeleteDialog() {
    deleteDialogOpen.value = false
    selectedSubject.value = null
  }

  return {
    selectedSubject,
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
