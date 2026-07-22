/* eslint-disable @stylistic/max-statements-per-line */
import type { StudentTableSchema } from '~~/shared/schemas/student'

export function useStudentDialogs() {
  const selectedStudent = useState<StudentTableSchema | null>('students:selected', () => null)
  const createDialogOpen = useState('students:create-dialog', () => false)
  const editDialogOpen = useState('students:edit-dialog', () => false)
  const deleteDialogOpen = useState('students:delete-dialog', () => false)
  const close = (dialog: Ref<boolean>) => { dialog.value = false; selectedStudent.value = null }
  return {
    selectedStudent, createDialogOpen, editDialogOpen, deleteDialogOpen,
    openCreateDialog: () => { createDialogOpen.value = true },
    closeCreateDialog: () => { createDialogOpen.value = false },
    openEditDialog: (student: StudentTableSchema) => { selectedStudent.value = student; editDialogOpen.value = true },
    closeEditDialog: () => close(editDialogOpen),
    openDeleteDialog: (student: StudentTableSchema) => { selectedStudent.value = student; deleteDialogOpen.value = true },
    closeDeleteDialog: () => close(deleteDialogOpen)
  }
}
