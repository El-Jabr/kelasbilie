export interface StudentClassRecord {
  id: string
  studentId?: string
  classroomId?: string
  semesterId?: string
}

export function useStudentClassDialogs<T extends StudentClassRecord = StudentClassRecord>() {
  const isSingleModalOpen = useState('student-classes:isSingleModalOpen', () => false)
  const editingId = useState<string | null>('student-classes:editingId', () => null)
  const selectedStudentClass = useState<T | null>('student-classes:selected', () => null)

  function openSingleCreateModal() {
    editingId.value = null
    selectedStudentClass.value = null
    isSingleModalOpen.value = true
  }

  function openSingleEditModal(item: T) {
    editingId.value = item.id
    selectedStudentClass.value = item
    isSingleModalOpen.value = true
  }

  function closeSingleModal() {
    isSingleModalOpen.value = false
    editingId.value = null
    selectedStudentClass.value = null
  }

  return {
    isSingleModalOpen,
    editingId,
    selectedStudentClass,
    openSingleCreateModal,
    openSingleEditModal,
    closeSingleModal
  }
}
