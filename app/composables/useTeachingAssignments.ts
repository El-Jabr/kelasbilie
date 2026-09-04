import { storeToRefs } from 'pinia'
import { useAssignmentStore } from '~~/app/stores/assignment'

export function useTeachingAssignments() {
  const store = useAssignmentStore()
  const {
    teachingAssignments,
    teachers,
    subjects,
    classes,
    semesters,
    courses,
    loadingTA: loading,
    selectedAssignment,
    teacherOptions,
    subjectOptions,
    classOptions,
    semesterOptions,
    courseOptions
  } = storeToRefs(store)

  return {
    teachingAssignments,
    teachers,
    subjects,
    classes,
    semesters,
    courses,
    loading,
    selectedAssignment,
    teacherOptions,
    subjectOptions,
    classOptions,
    semesterOptions,
    courseOptions,
    fetchTeachingAssignments: store.fetchTeachingAssignments,
    refresh: () => store.fetchTeachingAssignments(true)
  }
}
