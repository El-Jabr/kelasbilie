import { defineStore } from 'pinia'

export interface TeacherTeachingItem {
  id: string
  teacherId: string
  subjectId: string
  classroomId: string
  semesterId: string
  courseId?: number | null
  subject?: {
    id: string
    code: string
    name: string
    kkm?: number | null
  } | null
  classroom?: {
    id: string
    name: string
    level?: number | string | null
    room?: string | null
    building?: string | null
    floor?: number | null
  } | null
  semester?: {
    id: string
    type?: string
    isActive?: boolean
    academicYear?: {
      id: string
      name: string
    } | null
  } | null
  course?: {
    id: number
    fullname: string
    shortname: string
  } | null
}

export interface TeacherProfile {
  id: string
  userId: string
  nip: string | null
  user?: {
    id: string
    username: string
    fullname: string
    email: string
    role: string
    isActive: boolean
  } | null
  teachings: TeacherTeachingItem[]
}

export interface ActiveSemester {
  id: string
  type: string
  isActive: boolean
  academicYear?: {
    id: string
    name: string
  } | null
}

export interface TeacherProgressItem {
  teachingId: string
  subjectName: string
  className: string
  studentsCount: number
  gradeItemsCount: number
  expected: number
  filled: number
  percent: number
}

export interface TeacherProgressData {
  overallPercent: number
  totalExpected: number
  totalFilled: number
  items: TeacherProgressItem[]
}

export const useTeacherStore = defineStore('teacher', () => {
  const teacherProfile = ref<TeacherProfile | null>(null)
  const activeSemester = ref<ActiveSemester | null>(null)
  const progressData = ref<TeacherProgressData | null>(null)

  const isLoaded = ref(false)
  const isLoading = ref(false)

  let fetchPromise: Promise<void> | null = null

  async function fetchTeacherData(force = false) {
    if (isLoaded.value && !force) return
    if (fetchPromise) return fetchPromise

    isLoading.value = true

    fetchPromise = (async () => {
      try {
        const [teacherRes, semRes, progressRes] = await Promise.all([
          $fetch<{ success?: boolean, data: TeacherProfile }>('/api/teachers/me').catch(() => null),
          $fetch<{ success?: boolean, data: ActiveSemester }>('/api/semesters/active').catch(() => null),
          $fetch<TeacherProgressData>('/api/progress/teacher').catch(() => null)
        ])

        if (teacherRes?.data) teacherProfile.value = teacherRes.data
        if (semRes?.data) activeSemester.value = semRes.data
        if (progressRes) progressData.value = progressRes

        isLoaded.value = true
      } catch (err) {
        console.error('[TeacherStore] Failed to fetch data', err)
      } finally {
        isLoading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  async function updateProfile(data: Record<string, unknown>) {
    if (!teacherProfile.value) return
    await $fetch(`/api/teachers/${teacherProfile.value.id}`, {
      method: 'PATCH',
      body: data
    })
    // Force refresh after update
    await fetchTeacherData(true)
  }

  function reset() {
    teacherProfile.value = null
    activeSemester.value = null
    progressData.value = null
    isLoaded.value = false
    isLoading.value = false
    fetchPromise = null
  }

  return {
    teacherProfile,
    activeSemester,
    progressData,
    isLoaded,
    isLoading,
    fetchTeacherData,
    updateProfile,
    reset
  }
})
