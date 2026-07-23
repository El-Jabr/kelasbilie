/* eslint-disable @stylistic/max-statements-per-line */
import type { TeacherTableSchema } from '~~/shared/schemas/teacher'

export function useTeacherDialogs() {
  const selectedTeacher = useState<TeacherTableSchema | null>('teachers:selected', () => null)
  const createDialogOpen = useState('teachers:create-dialog', () => false)
  const editDialogOpen = useState('teachers:edit-dialog', () => false)
  const deleteDialogOpen = useState('teachers:delete-dialog', () => false)
  const close = (dialog: Ref<boolean>) => { dialog.value = false; selectedTeacher.value = null }
  return {
    selectedTeacher, createDialogOpen, editDialogOpen, deleteDialogOpen,
    openCreateDialog: () => { createDialogOpen.value = true },
    closeCreateDialog: () => { createDialogOpen.value = false },
    openEditDialog: (teacher: TeacherTableSchema) => { selectedTeacher.value = teacher; editDialogOpen.value = true },
    closeEditDialog: () => close(editDialogOpen),
    openDeleteDialog: (teacher: TeacherTableSchema) => { selectedTeacher.value = teacher; deleteDialogOpen.value = true },
    closeDeleteDialog: () => close(deleteDialogOpen)
  }
}
