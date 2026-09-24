export interface HomeroomRecord {
  id: string
  classroomId?: string
  teacherId?: string
  semesterId?: string
  classroom?: { name?: string, level?: string | number } | null
  teacher?: { user?: { fullname?: string } } | null
  semester?: { type?: string, academicYear?: { name?: string } | null } | null
}

export function useHomeroomDialogs<T extends HomeroomRecord = HomeroomRecord>() {
  const selectedHomeroom = useState<T | null>(
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

  function openEditDialog(homeroom: T) {
    selectedHomeroom.value = homeroom
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedHomeroom.value = null
  }

  function openDeleteDialog(homeroom: T) {
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
