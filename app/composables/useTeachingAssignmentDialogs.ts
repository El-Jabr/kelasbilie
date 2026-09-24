export interface AssignmentRecord {
  id: string
  teacherId?: string
  subjectId?: string
  classroomId?: string
  semesterId?: string
  courseId?: number | null
  teacher?: { user?: { fullname?: string } } | null
  subject?: { name?: string } | null
  classroom?: { name?: string } | null
  semester?: { type?: string, academicYear?: { name?: string } | null } | null
}

export function useTeachingAssignmentDialogs<T extends AssignmentRecord = AssignmentRecord>() {
  const selectedAssignment = useState<T | null>(
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

  function openEditDialog(assignment: T) {
    selectedAssignment.value = assignment
    editDialogOpen.value = true
  }

  function closeEditDialog() {
    editDialogOpen.value = false
    selectedAssignment.value = null
  }

  function openDeleteDialog(assignment: T) {
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
