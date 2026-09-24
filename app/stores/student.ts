import { defineStore } from 'pinia'
import type { ProgressionData } from '~/components/students/StudentProgressionChart.vue'

export interface HomeroomTeacherInfo {
  id: string
  nip: string
  user?: {
    fullname: string
    email: string
  }
}

export interface HomeroomItem {
  id: string
  semesterId: string
  teacher?: HomeroomTeacherInfo
  semester?: {
    id: string
    isActive: boolean
  }
}

export interface ClassroomInfo {
  id: string
  name: string
  level: number
  room: string
  building: string
  floor: number
  homerooms?: HomeroomItem[]
}

export interface SemesterInfo {
  id: string
  type: string
  isActive: boolean
  academicYear?: {
    id: string
    name: string
    isActive: boolean
  }
}

export interface StudentClassItem {
  id: string
  classroomId: string
  semesterId: string
  classroom?: ClassroomInfo
  semester?: SemesterInfo
}

export interface StudentMeData {
  id: string
  nis: string
  gender?: string
  religion?: string
  birthDate?: string | Date
  birthPlace?: string
  address?: string
  phone?: string
  parentName?: string
  parentPhone?: string
  user?: {
    fullname: string
    email: string
    username?: string
    isActive?: boolean
    avatar?: string
  }
  classes?: StudentClassItem[]
}

export interface ProgressItem {
  subjectName: string
  expected: number
  filled: number
  percent: number
}

export interface ProgressData {
  overallPercent: number
  percent: number
  totalExpected: number
  totalFilled: number
  items: ProgressItem[]
}

export interface StudentSemesterOption {
  label: string
  value: string
}

export interface StudentGradeRow {
  teachingId: string
  subjectName?: string
  teacherName?: string
  grades?: {
    ph?: number | null
    sts?: number | null
    sas?: number | null
    final?: number | null
    isPassed?: boolean
  }
  kkm?: number
  finalScore?: number
}

export interface GradeComponentRow {
  id: string
  gradeItem?: {
    name?: string
    category?: string
    itemType?: string
  }
  grade?: number
  score?: number | null
  lastUpdated?: string
  lastSync?: string | Date | null
  [key: string]: unknown
}

export const useStudentStore = defineStore('student', () => {
  // ── 1. Profile State ──────────────────────────────────────────────────
  const student = ref<StudentMeData | null>(null)
  const isLoadedProfile = ref(false)
  const pendingProfile = ref(false)
  let profilePromise: Promise<void> | null = null

  const studentId = computed(() => student.value?.id || '')
  const studentClassesList = computed<StudentClassItem[]>(() => student.value?.classes || [])

  const currentClass = computed<StudentClassItem | null>(() => {
    if (!studentClassesList.value.length) return null
    return studentClassesList.value.find(sc => sc.semester?.isActive) || studentClassesList.value[0] || null
  })

  const classroom = computed(() => currentClass.value?.classroom || null)
  const currentSemester = computed(() => currentClass.value?.semester || null)

  const homeroom = computed(() => {
    const homerooms = classroom.value?.homerooms
    if (!homerooms || !homerooms.length) return null
    const activeSemId = currentSemester.value?.id
    const matched = homerooms.find((h: HomeroomItem) => h.semesterId === activeSemId || h.semester?.isActive)
    return (matched || homerooms[0])?.teacher || null
  })

  function getFetch() {
    if (import.meta.server) {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      return <T>(url: string, opts: Record<string, unknown> = {}) => $fetch<T>(url, {
        ...opts,
        headers: { ...headers, ...(opts.headers as Record<string, string> || {}) }
      })
    }
    return <T>(url: string, opts: Record<string, unknown> = {}) => $fetch<T>(url, {
      credentials: 'include',
      ...opts
    })
  }

  async function fetchProfile(force = false) {
    if (isLoadedProfile.value && !force && student.value) return
    if (profilePromise) return profilePromise

    pendingProfile.value = true
    profilePromise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<{ success?: boolean, data?: StudentMeData }>('/api/students/me')
        student.value = res?.data || null
        isLoadedProfile.value = true
      } catch (err) {
        console.error('[StudentStore] Gagal memuat profil siswa:', err)
      } finally {
        pendingProfile.value = false
        profilePromise = null
      }
    })()

    return profilePromise
  }

  // ── 2. Semesters State ────────────────────────────────────────────────
  const semesters = ref<SemesterInfo[]>([])
  const isLoadedSemesters = ref(false)
  const pendingSemesters = ref(false)
  let semestersPromise: Promise<void> | null = null

  const semesterOptions = computed<StudentSemesterOption[]>(() => [
    { label: 'Semester Aktif (Sistem)', value: 'ACTIVE' },
    ...semesters.value.map(s => ({
      label: `${s.type === 'GENAP' ? 'Genap' : 'Ganjil'} ${s.academicYear?.name || ''}${s.isActive ? ' (Aktif)' : ''}`,
      value: s.id
    }))
  ])

  async function fetchSemesters(force = false) {
    if (isLoadedSemesters.value && !force && semesters.value.length > 0) return
    if (semestersPromise) return semestersPromise

    pendingSemesters.value = true
    semestersPromise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<{ data?: SemesterInfo[] }>('/api/semesters?limit=100')
        if (res?.data) {
          semesters.value = res.data
          isLoadedSemesters.value = true
        }
      } catch (err) {
        console.error('[StudentStore] Gagal mengambil daftar semester:', err)
      } finally {
        pendingSemesters.value = false
        semestersPromise = null
      }
    })()

    return semestersPromise
  }

  // ── 3. Task Progress State ────────────────────────────────────────────
  const progressData = ref<ProgressData | null>(null)
  const isLoadedProgress = ref(false)
  const pendingProgress = ref(false)
  let progressPromise: Promise<void> | null = null

  const safeOverallPercent = computed(() => {
    const val = Number(progressData.value?.overallPercent ?? progressData.value?.percent)
    return isNaN(val) ? 0 : Math.min(Math.max(val, 0), 100)
  })
  const safeTotalFilled = computed(() => Number(progressData.value?.totalFilled) || 0)
  const safeTotalExpected = computed(() => Number(progressData.value?.totalExpected) || 0)

  async function fetchProgress(force = false) {
    if (isLoadedProgress.value && !force && progressData.value) return
    if (progressPromise) return progressPromise

    pendingProgress.value = true
    progressPromise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<ProgressData>('/api/progress/student')
        progressData.value = res || null
        isLoadedProgress.value = true
      } catch (err) {
        console.error('[StudentStore] Gagal memuat progres tugas siswa:', err)
      } finally {
        pendingProgress.value = false
        progressPromise = null
      }
    })()

    return progressPromise
  }

  // ── 4. Progression Line Chart History State ───────────────────────────
  const progressionData = ref<ProgressionData | null>(null)
  const isLoadedProgression = ref(false)
  const pendingProgression = ref(false)
  let progressionPromise: Promise<void> | null = null

  async function fetchProgression(force = false) {
    if (isLoadedProgression.value && !force && progressionData.value) return
    if (progressionPromise) return progressionPromise

    pendingProgression.value = true
    progressionPromise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<{ status?: string, data?: ProgressionData }>('/api/students/progression')
        progressionData.value = res?.data || null
        isLoadedProgression.value = true
      } catch (err) {
        console.error('[StudentStore] Gagal memuat data perkembangan semester siswa:', err)
      } finally {
        pendingProgression.value = false
        progressionPromise = null
      }
    })()

    return progressionPromise
  }

  // ── 5. Grades per Semester (In-Memory Cache) ──────────────────────────
  const selectedSemesterId = ref<string>('ACTIVE')
  const gradesCache = ref<Record<string, StudentGradeRow[]>>({})
  const pendingGrades = ref(false)
  const gradesPromises = new Map<string, Promise<void>>()

  const currentSemesterType = computed(() => {
    if (selectedSemesterId.value && selectedSemesterId.value !== 'ACTIVE') {
      const found = semesters.value.find(s => s.id === selectedSemesterId.value)
      if (found) return found.type
    }
    return currentSemester.value?.type
  })

  const currentGradesList = computed<StudentGradeRow[]>(() => {
    return gradesCache.value[selectedSemesterId.value] || []
  })

  async function fetchGrades(semesterId = selectedSemesterId.value, force = false) {
    if (!student.value?.id) {
      await fetchProfile(force)
    }
    const sId = studentId.value
    if (!sId) return

    const cacheKey = semesterId || 'ACTIVE'
    if (gradesCache.value[cacheKey] && !force) return

    if (gradesPromises.has(cacheKey)) {
      return gradesPromises.get(cacheKey)
    }

    pendingGrades.value = true
    const promise = (async () => {
      try {
        const query: Record<string, string> = {}
        if (cacheKey && cacheKey !== 'ACTIVE') {
          query.semesterId = cacheKey
        }
        const apiFetch = getFetch()
        const res = await apiFetch<{ data?: StudentGradeRow[] }>(`/api/grades/student/${sId}`, {
          query
        })
        gradesCache.value = {
          ...gradesCache.value,
          [cacheKey]: res?.data || []
        }
      } catch (err) {
        console.error(`[StudentStore] Gagal memuat nilai semester ${cacheKey}:`, err)
      } finally {
        pendingGrades.value = false
        gradesPromises.delete(cacheKey)
      }
    })()

    gradesPromises.set(cacheKey, promise)
    return promise
  }

  // ── 6. Teaching Assignment & Components Cache ─────────────────────────
  const teachingsCache = ref<Record<string, Record<string, unknown>>>({})
  const componentsCache = ref<Record<string, GradeComponentRow[]>>({})
  const pendingTeaching = ref(false)
  const pendingComponents = ref(false)
  const teachingPromises = new Map<string, Promise<void>>()
  const componentPromises = new Map<string, Promise<void>>()

  async function fetchTeaching(teachingId: string, force = false) {
    if (!teachingId) return null
    if (teachingsCache.value[teachingId] && !force) {
      return teachingsCache.value[teachingId]
    }

    if (teachingPromises.has(teachingId)) {
      await teachingPromises.get(teachingId)
      return teachingsCache.value[teachingId]
    }

    pendingTeaching.value = true
    const promise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<{ data?: Record<string, unknown> }>(`/api/teaching-assignments/${teachingId}`)
        if (res?.data) {
          teachingsCache.value = {
            ...teachingsCache.value,
            [teachingId]: res.data
          }
        }
      } catch (err) {
        console.error(`[StudentStore] Gagal mengambil detail penugasan ${teachingId}:`, err)
      } finally {
        pendingTeaching.value = false
        teachingPromises.delete(teachingId)
      }
    })()

    teachingPromises.set(teachingId, promise)
    await promise
    return teachingsCache.value[teachingId]
  }

  async function fetchComponents(teachingId: string, force = false) {
    if (!teachingId) return []
    if (!student.value?.id) {
      await fetchProfile(force)
    }
    const sId = studentId.value
    if (!sId) return []

    const cacheKey = `${sId}__${teachingId}`
    if (componentsCache.value[cacheKey] && !force) {
      return componentsCache.value[cacheKey]
    }

    if (componentPromises.has(cacheKey)) {
      await componentPromises.get(cacheKey)
      return componentsCache.value[cacheKey] || []
    }

    pendingComponents.value = true
    const promise = (async () => {
      try {
        const apiFetch = getFetch()
        const res = await apiFetch<{ data?: GradeComponentRow[] }>('/api/grades/components', {
          query: {
            studentId: sId,
            teachingId
          }
        })
        componentsCache.value = {
          ...componentsCache.value,
          [cacheKey]: res?.data || []
        }
      } catch (err) {
        console.error(`[StudentStore] Gagal mengambil komponen nilai ${teachingId}:`, err)
      } finally {
        pendingComponents.value = false
        componentPromises.delete(cacheKey)
      }
    })()

    componentPromises.set(cacheKey, promise)
    await promise
    return componentsCache.value[cacheKey] || []
  }

  // ── 7. Composite Dashboard & Cache Clearing ───────────────────────────
  async function fetchDashboard(force = false) {
    await Promise.all([
      fetchProfile(force),
      fetchProgress(force),
      fetchProgression(force)
    ])
  }

  function clearAllCache() {
    student.value = null
    isLoadedProfile.value = false
    progressData.value = null
    isLoadedProgress.value = false
    progressionData.value = null
    isLoadedProgression.value = false
    semesters.value = []
    isLoadedSemesters.value = false
    gradesCache.value = {}
    teachingsCache.value = {}
    componentsCache.value = {}
  }

  return {
    // Profile
    student,
    studentId,
    studentClassesList,
    currentClass,
    classroom,
    currentSemester,
    homeroom,
    isLoadedProfile,
    pendingProfile,
    fetchProfile,

    // Semesters
    semesters,
    isLoadedSemesters,
    pendingSemesters,
    semesterOptions,
    fetchSemesters,

    // Progress
    progressData,
    safeOverallPercent,
    safeTotalFilled,
    safeTotalExpected,
    isLoadedProgress,
    pendingProgress,
    fetchProgress,

    // Progression
    progressionData,
    isLoadedProgression,
    pendingProgression,
    fetchProgression,

    // Grades
    selectedSemesterId,
    currentSemesterType,
    gradesCache,
    currentGradesList,
    pendingGrades,
    fetchGrades,

    // Teaching & Components
    teachingsCache,
    componentsCache,
    pendingTeaching,
    pendingComponents,
    fetchTeaching,
    fetchComponents,

    // Composite & Reset
    fetchDashboard,
    clearAllCache
  }
})
