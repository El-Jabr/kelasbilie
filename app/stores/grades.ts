import { defineStore } from 'pinia'

export interface GradeDropdownOption {
  label: string
  value: string
}

export interface InspectionGradeItem {
  id: number
  courseId: number
  name: string
  category: string | null
  itemNumber: number | null
}

export interface InspectionTeachingItem {
  id: string
  courseId: number | null
  subjectCode?: string
  subjectName?: string
  teacherName?: string
  subject?: { id?: string, name?: string, code?: string }
  classroom?: { id?: string, name?: string }
  teacher?: { id?: string, user?: { fullname?: string } }
}

export interface InspectionStudentOverview {
  studentId: string
  nis?: string | null
  fullname: string
  subjectGrades?: Record<string, { ph: number | null, sts: number | null, sas: number | null, final: number | null, isPassed?: boolean }>
  itemScores?: Record<number, number | null>
  phScores?: Record<number, number | null>
  itemDetails?: Record<number, { id: number, score: number | null, feedback?: string | null }>
  averagePh?: number | null
  stsScore?: number | null
  sasScore?: number | null
  finalGrade?: number | null
}

export interface InspectionData {
  mode: string
  message?: string
  semester?: {
    id: string
    type: string
    academicYear?: { id: string, name: string } | null
  } | null
  teaching?: InspectionTeachingItem | null
  teachings?: InspectionTeachingItem[]
  phGradeItems?: InspectionGradeItem[]
  stsGradeItems?: InspectionGradeItem[]
  sasGradeItems?: InspectionGradeItem[]
  uncategorizedItems?: InspectionGradeItem[]
  detailGradeItems?: InspectionGradeItem[]
  students?: InspectionStudentOverview[]
}

export interface CachedInspection {
  data: InspectionData
  timestamp: number
}

export interface GradeClassroomItem {
  id: string
  name: string
  level: number | string
}

export interface GradeSemesterItem {
  id: string
  type: string
  isActive: boolean
  academicYear?: { id?: string, name?: string } | null
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit cache TTL

export const useGradesStore = defineStore('grades', () => {
  // ── 1. State: Filter & Pagination (Preserved across page transitions) ────
  const selectedSemesterId = ref<string>('ACTIVE')
  const selectedClassroomId = ref<string>('ALL')
  const selectedTeachingId = ref<string>('ALL')
  const searchInput = ref<string>('')
  const currentPage = ref<number>(1)
  const itemsPerPage = ref<number>(10)

  // ── 2. State: Dropdown Options & Cached Data ────────────────────────────
  const semesters = ref<GradeSemesterItem[]>([])
  const isLoadedSemesters = ref<boolean>(false)
  const classrooms = ref<GradeClassroomItem[]>([])
  const isLoadedClassrooms = ref<boolean>(false)
  const pendingDropdowns = ref<boolean>(false)

  // Map: `${classroomId}__${semesterId}` -> DropdownOption[]
  const teachingsByClassroom = ref<Record<string, GradeDropdownOption[]>>({})

  // Active Inspection Data & Cache
  const currentInspection = ref<InspectionData | null>(null)
  const inspectionCache = ref<Record<string, CachedInspection>>({})

  // Loading States
  const pending = ref<boolean>(false)
  const isSyncingMoodle = ref<boolean>(false)

  // In-flight Promise Tracking for Deduplication
  let semestersPromise: Promise<void> | null = null
  let classroomsPromise: Promise<void> | null = null
  const teachingsPromises = new Map<string, Promise<GradeDropdownOption[]>>()
  const inspectionPromises = new Map<string, Promise<InspectionData>>()

  // ── Helper: Helper to safely extract string ID ─────────────────────────
  function extractId(val: unknown): string {
    if (!val) return 'ALL'
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>
      if (typeof obj.value === 'string') return obj.value
      if (typeof obj.id === 'string') return obj.id
      return 'ALL'
    }
    return String(val)
  }

  // ── Computed Options ───────────────────────────────────────────────────
  const semesterOptions = computed<GradeDropdownOption[]>(() => {
    return [
      { label: 'Semester Aktif (Sistem)', value: 'ACTIVE' },
      ...semesters.value.map(s => ({
        label: `${s.type === 'GENAP' ? 'Genap' : 'Ganjil'} ${s.academicYear?.name || ''}${s.isActive ? ' (Aktif)' : ''}`,
        value: s.id
      }))
    ]
  })

  const classroomOptions = computed<GradeDropdownOption[]>(() => {
    return [
      { label: '-- Pilih Kelas --', value: 'ALL' },
      ...classrooms.value.map(c => ({
        label: `Kelas ${c.name} (Tingkat ${c.level})`,
        value: c.id
      }))
    ]
  })

  const currentTeachingOptions = computed<GradeDropdownOption[]>(() => {
    const cid = extractId(selectedClassroomId.value)
    const sem = extractId(selectedSemesterId.value)
    if (!cid || cid === 'ALL') {
      return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
    }
    const key = `${cid}__${sem}`
    return teachingsByClassroom.value[key] || teachingsByClassroom.value[cid] || [
      { label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }
    ]
  })

  // ── Action: Fetch Semesters ────────────────────────────────────────────
  async function fetchSemesters(force = false) {
    if (isLoadedSemesters.value && !force && semesters.value.length > 0) {
      return
    }

    if (semestersPromise) {
      return semestersPromise
    }

    semestersPromise = (async () => {
      try {
        const res = await $fetch<{ data?: GradeSemesterItem[] }>('/api/semesters?limit=100', { credentials: 'include' })
        if (res?.data) {
          semesters.value = res.data
          isLoadedSemesters.value = true
        }
      } catch (err) {
        console.error('[GradesStore] Gagal mengambil daftar semester:', err)
      } finally {
        semestersPromise = null
      }
    })()

    return semestersPromise
  }

  // ── Action: Fetch Classrooms ───────────────────────────────────────────
  async function fetchClassrooms(force = false) {
    if (isLoadedClassrooms.value && !force && classrooms.value.length > 0) {
      return
    }

    if (classroomsPromise) {
      return classroomsPromise
    }

    if (classrooms.value.length === 0) {
      pendingDropdowns.value = true
    }

    classroomsPromise = (async () => {
      try {
        const res = await $fetch<{ data?: GradeClassroomItem[] }>('/api/classes', { credentials: 'include' })
        if (res?.data) {
          classrooms.value = res.data
          isLoadedClassrooms.value = true
        }
      } catch (err) {
        console.error('[GradesStore] Gagal mengambil daftar kelas:', err)
      } finally {
        pendingDropdowns.value = false
        classroomsPromise = null
      }
    })()

    return classroomsPromise
  }

  // ── Action: Fetch Teachings For Classroom ──────────────────────────────
  async function fetchTeachingsForClassroom(classroomIdVal: unknown, semesterIdVal?: unknown, force = false): Promise<GradeDropdownOption[]> {
    const cid = extractId(classroomIdVal)
    const sem = extractId(semesterIdVal !== undefined ? semesterIdVal : selectedSemesterId.value)
    const key = `${cid}__${sem}`

    if (!cid || cid === 'ALL') {
      return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
    }

    if (!force && teachingsByClassroom.value[key]?.length) {
      return teachingsByClassroom.value[key]
    }

    if (teachingsPromises.has(key)) {
      return teachingsPromises.get(key)!
    }

    const promise = (async () => {
      try {
        let targetSemId: string | undefined
        if (sem && sem !== 'ALL' && sem !== 'ACTIVE') {
          targetSemId = sem
        } else {
          try {
            const activeSem = await $fetch<{ data?: { id: string } }>('/api/semesters/active')
            targetSemId = activeSem?.data?.id
          } catch {
            // Fallback
          }
        }

        interface TeachingRecord {
          id: string
          subject?: { code?: string, name?: string } | null
          teacher?: { user?: { fullname?: string } | null } | null
        }

        const res = await $fetch<{ data?: TeachingRecord[] }>('/api/teaching-assignments', {
          query: {
            classroomId: cid,
            ...(targetSemId ? { semesterId: targetSemId } : { activeSemester: 'true' }),
            limit: 100
          },
          credentials: 'include'
        })

        const options: GradeDropdownOption[] = [
          { label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' },
          ...(res?.data || []).map(t => ({
            label: `${t.subject?.code} - ${t.subject?.name} (${t.teacher?.user?.fullname || 'No Teacher'})`,
            value: t.id
          }))
        ]

        teachingsByClassroom.value[key] = options
        return options
      } catch (err) {
        console.error(`[GradesStore] Gagal memuat mata pelajaran kelas ${cid}:`, err)
        return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
      } finally {
        teachingsPromises.delete(key)
      }
    })()

    teachingsPromises.set(key, promise)
    return promise
  }

  // ── Helper: Cache Key Generator ────────────────────────────────────────
  function getCacheKey(classroomId: string, teachingId: string, search: string, semesterId?: string): string {
    const c = extractId(classroomId)
    const t = extractId(teachingId)
    const s = (search || '').trim().toLowerCase()
    const sem = extractId(semesterId !== undefined ? semesterId : selectedSemesterId.value)
    return `${c}__${t}__${s}__${sem}`
  }

  // ── Action: Fetch Inspection Data (SWR Pattern) ────────────────────────
  async function fetchInspection(
    classroomIdVal?: unknown,
    teachingIdVal?: unknown,
    searchVal?: string,
    force = false,
    semesterIdVal?: unknown
  ) {
    const cid = extractId(classroomIdVal !== undefined ? classroomIdVal : selectedClassroomId.value)
    const tid = extractId(teachingIdVal !== undefined ? teachingIdVal : selectedTeachingId.value)
    const search = searchVal !== undefined ? searchVal : searchInput.value
    const sem = extractId(semesterIdVal !== undefined ? semesterIdVal : selectedSemesterId.value)

    if (!cid || cid === 'ALL') {
      currentInspection.value = null
      pending.value = false
      return null
    }

    const cacheKey = getCacheKey(cid, tid, search, sem)
    const cached = inspectionCache.value[cacheKey]
    const now = Date.now()
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS)

    // 1. SWR Cache Hit: Segera gunakan data cache tanpa loading spinner!
    if (isCacheValid && !force) {
      currentInspection.value = cached.data
      pending.value = false
      return cached.data
    }

    // Jika ada cached data (walaupun stale), tampilkan langsung sembari revalidasi di background
    if (cached && !force) {
      currentInspection.value = cached.data
    } else {
      // Hanya tampilkan loading spinner jika belum ada data sama sekali
      pending.value = true
    }

    // Deduplikasi in-flight request
    if (inspectionPromises.has(cacheKey)) {
      return inspectionPromises.get(cacheKey)
    }

    const promise = (async () => {
      try {
        const res = await $fetch<InspectionData>('/api/grades/inspection', {
          query: {
            classroomId: cid,
            teachingId: tid,
            search: search || undefined,
            semesterId: sem !== 'ACTIVE' && sem !== 'ALL' ? sem : undefined
          },
          credentials: 'include'
        })

        // Simpan ke cache
        inspectionCache.value[cacheKey] = {
          data: res,
          timestamp: Date.now()
        }

        // Hanya perbarui currentInspection jika user masih melihat filter yang sama
        const currentActiveKey = getCacheKey(
          selectedClassroomId.value,
          selectedTeachingId.value,
          searchInput.value,
          selectedSemesterId.value
        )
        if (currentActiveKey === cacheKey) {
          currentInspection.value = res
        }

        return res
      } catch (err) {
        console.error(`[GradesStore] Gagal memuat data inspeksi nilai (${cacheKey}):`, err)
        if (!cached) {
          currentInspection.value = null
        }
        throw err
      } finally {
        pending.value = false
        inspectionPromises.delete(cacheKey)
      }
    })()

    inspectionPromises.set(cacheKey, promise)
    return promise
  }

  // ── Action: Invalidate Cache (misal setelah sync moodle atau input nilai) ─
  function invalidateCache(classroomId?: string) {
    if (classroomId) {
      const cid = extractId(classroomId)
      const newCache: Record<string, CachedInspection> = {}
      for (const [key, val] of Object.entries(inspectionCache.value)) {
        if (!key.startsWith(`${cid}__`)) {
          newCache[key] = val
        }
      }
      inspectionCache.value = newCache
    } else {
      inspectionCache.value = {}
    }
  }

  // ── Action: Reset Filters ──────────────────────────────────────────────
  function resetFilter() {
    selectedSemesterId.value = 'ACTIVE'
    selectedClassroomId.value = 'ALL'
    selectedTeachingId.value = 'ALL'
    searchInput.value = ''
    currentPage.value = 1
    currentInspection.value = null
    pending.value = false
  }

  return {
    // State
    selectedSemesterId,
    selectedClassroomId,
    selectedTeachingId,
    searchInput,
    currentPage,
    itemsPerPage,
    semesters,
    isLoadedSemesters,
    classrooms,
    isLoadedClassrooms,
    pendingDropdowns,
    teachingsByClassroom,
    currentInspection,
    inspectionCache,
    pending,
    isSyncingMoodle,

    // Computed
    semesterOptions,
    classroomOptions,
    currentTeachingOptions,

    // Actions & Methods
    extractId,
    fetchSemesters,
    fetchClassrooms,
    fetchTeachingsForClassroom,
    fetchInspection,
    invalidateCache,
    resetFilter
  }
})
