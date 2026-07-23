/* eslint-disable @stylistic/max-statements-per-line */
import type { CreateTeacherSchema, UpdateTeacherSchema } from '~~/shared/schemas/teacher'

function message(error: unknown) {
  return error && typeof error === 'object' && 'statusMessage' in error && typeof error.statusMessage === 'string'
    ? error.statusMessage
    : 'Terjadi kesalahan.'
}

export function useTeacherActions() {
  const toast = useToast()
  const { refresh } = useTeachers()
  const { selectedTeacher, closeCreateDialog, closeEditDialog, closeDeleteDialog } = useTeacherDialogs()
  const creating = useState('teachers:creating', () => false)
  const updating = useState('teachers:updating', () => false)
  const deleting = useState('teachers:deleting', () => false)

  async function createTeacher(data: CreateTeacherSchema) {
    creating.value = true
    try {
      await $fetch('/api/teachers', { method: 'POST', body: data })
      toast.add({ title: 'Berhasil', description: 'Guru berhasil ditambahkan.', color: 'success' })
      closeCreateDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { creating.value = false }
  }
  async function updateTeacher(data: UpdateTeacherSchema) {
    if (!selectedTeacher.value) return
    updating.value = true
    try {
      await $fetch(`/api/teachers/${selectedTeacher.value.id}`, { method: 'PATCH', body: data })
      toast.add({ title: 'Berhasil', description: 'Guru berhasil diperbarui.', color: 'success' })
      closeEditDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { updating.value = false }
  }
  async function deleteTeacher() {
    if (!selectedTeacher.value) return
    deleting.value = true
    try {
      await $fetch(`/api/teachers/${selectedTeacher.value.id}`, { method: 'DELETE' })
      toast.add({ title: 'Berhasil', description: 'Guru berhasil dihapus.', color: 'success' })
      closeDeleteDialog(); await refresh()
    } catch (error) { toast.add({ title: 'Gagal', description: message(error), color: 'error' }) } finally { deleting.value = false }
  }
  return { creating, updating, deleting, createTeacher, updateTeacher, deleteTeacher }
}
