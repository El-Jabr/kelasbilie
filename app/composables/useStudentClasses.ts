import { storeToRefs } from 'pinia'
import { useStudentClassStore } from '~~/app/stores/studentClass'

export function useStudentClasses() {
  const store = useStudentClassStore()
  const {
    page,
    limit,
    searchQuery,
    searchInput,
    filterSemesterId,
    filterClassroomId,
    pendingSC,
    studentClasses,
    pagination,
    students,
    classes,
    semesters,
    studentOptions,
    classOptions,
    filterClassOptions,
    semesterOptions,
    filterSemesterOptions
  } = storeToRefs(store)

  return {
    page,
    limit,
    searchQuery,
    searchInput,
    filterSemesterId,
    filterClassroomId,
    pendingSC,
    studentClasses,
    pagination,
    students,
    classes,
    semesters,
    studentOptions,
    classOptions,
    filterClassOptions,
    semesterOptions,
    filterSemesterOptions,
    refreshSC: (force?: boolean | unknown) => store.refreshSC(force === true),
    loadSupportingData: store.loadSupportingData,
    resetFilter: store.resetFilter
  }
}
