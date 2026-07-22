/* eslint-disable @stylistic/max-statements-per-line */
import type { CreateStudentSchema, UpdateStudentSchema } from '~~/shared/schemas/student'

function message(error: unknown) {
  return error && typeof error === 'object' && 'statusMessage' in error && typeof error.statusMessage === 'string'
    ? error.statusMessage
    : 'Terjadi kesalahan.'
}

export function useStudentActions() {
  const toast = useToast()
  const { refresh } = useStudents()
  const { selectedStudent, closeCreateDialog, closeEditDialog, closeDeleteDialog } = useStudentDialogs()
  const creating = useState('students:creating', () => false)
  const updating = useState('students:updating', () => false)
  const deleting = useState('students:deleting', () => false)

  async function createStudent(data: CreateStudentSchema) {
    creating.value = true
    try {
      await $fetch('/api/students', { method: 'POST', body: data })
      toast.add({ title: 'Berhasil', description: 'Siswa berhasil ditambahkan.', color: 'success' })
      closeCreateDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { creating.value = false }
  }
  async function updateStudent(data: UpdateStudentSchema) {
    if (!selectedStudent.value) return
    updating.value = true
    try {
      await $fetch(`/api/students/${selectedStudent.value.id}`, { method: 'PATCH', body: data })
      toast.add({ title: 'Berhasil', description: 'Siswa berhasil diperbarui.', color: 'success' })
      closeEditDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { updating.value = false }
  }
  async function deleteStudent() {
    if (!selectedStudent.value) return
    deleting.value = true
    try {
      await $fetch(`/api/students/${selectedStudent.value.id}`, { method: 'DELETE' })
      toast.add({ title: 'Berhasil', description: 'Siswa berhasil dihapus.', color: 'success' })
      closeDeleteDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { deleting.value = false }
  }
  return { creating, updating, deleting, createStudent, updateStudent, deleteStudent }
}
