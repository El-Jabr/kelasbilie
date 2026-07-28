export function useStudentClassDialogs() {
  const isSingleModalOpen = useState('student-classes:isSingleModalOpen', () => false)
  const editingId = useState<string | null>('student-classes:editingId', () => null)
  const selectedStudentClass = useState<any | null>('student-classes:selected', () => null)

  function openSingleCreateModal() {
    editingId.value = null
    selectedStudentClass.value = null
    isSingleModalOpen.value = true
  }

  function openSingleEditModal(item: any) {
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
