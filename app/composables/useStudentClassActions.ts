export function useStudentClassActions() {
  const toast = useToast()
  const { refreshSC } = useStudentClasses()
  const { closeSingleModal, editingId } = useStudentClassDialogs()

  const isBulkSubmitting = useState('student-classes:isBulkSubmitting', () => false)
  const isCloneSubmitting = useState('student-classes:isCloneSubmitting', () => false)
  const isSingleSubmitting = useState('student-classes:isSingleSubmitting', () => false)

  async function handleBulkAssign(bulkForm: { classroomId: string, semesterId: string, selectedStudentIds: string[] }, onSuccess?: () => void) {
    if (!bulkForm.classroomId || !bulkForm.semesterId || !bulkForm.selectedStudentIds.length) {
      toast.add({
        title: 'Validasi Gagal',
        description: 'Pilih Kelas, Semester, dan minimal 1 siswa.',
        color: 'error'
      })
      return
    }

    isBulkSubmitting.value = true
    try {
      const res: any = await $fetch('/api/student-classes/bulk', {
        method: 'POST',
        body: {
          classroomId: bulkForm.classroomId,
          semesterId: bulkForm.semesterId,
          studentIds: bulkForm.selectedStudentIds
        }
      })
      toast.add({
        title: 'Berhasil Mendaftarkan',
        description: res.message || 'Pembagian kelas siswa massal berhasil.',
        color: 'success'
      })
      await refreshSC()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Terjadi kesalahan.'
      toast.add({
        title: 'Gagal Bulk Assign',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      isBulkSubmitting.value = false
    }
  }

  async function handleCloneSemester(cloneForm: { fromSemesterId: string, toSemesterId: string, promoteLevel: boolean }, onSuccess?: () => void) {
    if (!cloneForm.fromSemesterId || !cloneForm.toSemesterId) {
      toast.add({
        title: 'Validasi Gagal',
        description: 'Pilih Semester Asal dan Semester Tujuan.',
        color: 'error'
      })
      return
    }

    isCloneSubmitting.value = true
    try {
      const res: any = await $fetch('/api/student-classes/clone', {
        method: 'POST',
        body: cloneForm
      })
      toast.add({
        title: 'Clone Semester Selesai',
        description: res.message || 'Proses clone semester berhasil diselesaikan.',
        color: 'success'
      })
      await refreshSC()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Terjadi kesalahan.'
      toast.add({
        title: 'Gagal Clone Semester',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      isCloneSubmitting.value = false
    }
  }

  async function handleSingleSubmit(singleForm: { studentId: string, classroomId: string, semesterId: string }) {
    if (!singleForm.studentId || !singleForm.classroomId || !singleForm.semesterId) {
      toast.add({
        title: 'Validasi Gagal',
        description: 'Field Siswa, Kelas, dan Semester wajib diisi.',
        color: 'error'
      })
      return
    }

    isSingleSubmitting.value = true
    try {
      if (editingId.value) {
        await $fetch(`/api/student-classes/${editingId.value}`, {
          method: 'PATCH',
          body: singleForm
        })
        toast.add({
          title: 'Berhasil Diperbarui',
          description: 'Data pembagian kelas siswa berhasil diperbarui.',
          color: 'success'
        })
      } else {
        const res: any = await $fetch('/api/student-classes', {
          method: 'POST',
          body: singleForm
        })
        toast.add({
          title: 'Berhasil',
          description: res.message || 'Siswa berhasil didaftarkan ke kelas.',
          color: 'success'
        })
      }
      closeSingleModal()
      await refreshSC()
    } catch (error: any) {
      const errorMsg = error.data?.statusMessage || error.data?.message || error.message || 'Gagal menyimpan.'
      toast.add({
        title: 'Gagal',
        description: errorMsg,
        color: 'error'
      })
    } finally {
      isSingleSubmitting.value = false
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa dari kelas ini?')) return

    try {
      await $fetch(`/api/student-classes/${id}`, { method: 'DELETE' })
      toast.add({
        title: 'Dihapus',
        description: 'Pendaftaran siswa dari kelas berhasil dihapus.',
        color: 'success'
      })
      await refreshSC()
    } catch (error: any) {
      const errorMsg = error.data?.statusMessage || error.data?.message || error.message || 'Gagal menghapus data.'
      toast.add({
        title: 'Gagal Menghapus',
        description: errorMsg,
        color: 'error'
      })
    }
  }

  return {
    isBulkSubmitting,
    isCloneSubmitting,
    isSingleSubmitting,
    handleBulkAssign,
    handleCloneSemester,
    handleSingleSubmit,
    handleDelete
  }
}
