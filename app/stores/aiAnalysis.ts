import { defineStore } from 'pinia'

export interface StudentOption {
  id: string
  nis: string
  user: { fullname: string }
}

export interface SemesterOption {
  id: string
  type: string
  isActive: boolean
  academicYear: { name: string }
}

export interface AiClassroomOption {
  id: string
  name: string
  level?: string | number
}

export interface AIAnalysisResult {
  data: any
  cached: boolean
  generatedAt: string
  timestamp: number
}

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 menit cache TTL untuk analisis AI

export const useAiAnalysisStore = defineStore('aiAnalysis', () => {
  // ── 1. State: Filter Options & Preserved Selections ─────────────────────
  const students = ref<StudentOption[]>([])
  const semesters = ref<SemesterOption[]>([])
  const classrooms = ref<AiClassroomOption[]>([])
  const isLoadedFilters = ref<boolean>(false)
  const loadingFilters = ref<boolean>(false)

  // Persisted selections across navigation
  const selectedStudentId = ref<string>('')
  const selectedSemesterId = ref<string>('')
  const selectedClassroomId = ref<string>('')

  // ── 2. State: Active Analysis Outputs & Statuses ───────────────────────
  const currentStudentAnalysis = ref<any | null>(null)
  const currentClassAnalysis = ref<any | null>(null)
  const currentSubjectAnalysis = ref<any | null>(null)

  const isAnalyzingStudent = ref<boolean>(false)
  const isAnalyzingClass = ref<boolean>(false)
  const isAnalyzingSubject = ref<boolean>(false)

  // ── 3. State: AI Analysis Caches (Key -> AIAnalysisResult) ─────────────
  const studentAnalysisCache = ref<Record<string, AIAnalysisResult>>({})
  const classAnalysisCache = ref<Record<string, AIAnalysisResult>>({})
  const subjectAnalysisCache = ref<Record<string, AIAnalysisResult>>({})

  // ── 4. In-flight Promises for Request Deduplication ────────────────────
  let filtersPromise: Promise<void> | null = null
  const studentPromises = new Map<string, Promise<any>>()
  const classPromises = new Map<string, Promise<any>>()
  const subjectPromises = new Map<string, Promise<any>>()

  // ── Computed Options ───────────────────────────────────────────────────
  const studentOptions = computed(() => {
    return students.value.map(s => ({
      label: `${s.user?.fullname || 'Tanpa Nama'} (${s.nis || '-'})`,
      value: s.id
    }))
  })

  const semesterOptions = computed(() => {
    return semesters.value.map(s => ({
      label: `${s.type} ${s.academicYear?.name || ''}${s.isActive ? ' (Aktif)' : ''}`,
      value: s.id
    }))
  })

  const classroomOptions = computed(() => {
    return classrooms.value.map(c => ({
      label: c.name,
      value: c.id
    }))
  })

  // ── Action: Fetch Filters (SWR Pattern) ────────────────────────────────
  async function fetchFilters(force = false) {
    if (!force && isLoadedFilters.value && students.value.length > 0) {
      // Auto select active semester if not selected
      if (!selectedSemesterId.value && semesters.value.length) {
        const activeSem = semesters.value.find(s => s.isActive)
        if (activeSem) selectedSemesterId.value = activeSem.id
      }
      return
    }

    if (filtersPromise) {
      return filtersPromise
    }

    if (students.value.length === 0) {
      loadingFilters.value = true
    }

    filtersPromise = (async () => {
      try {
        const [studRes, semRes, classRes]: any = await Promise.all([
          $fetch('/api/students?limit=1000', { credentials: 'include' }).catch(() => ({ data: [] })),
          $fetch('/api/semesters?limit=1000', { credentials: 'include' }).catch(() => ({ data: [] })),
          $fetch('/api/classes?limit=1000', { credentials: 'include' }).catch(() => ({ data: [] }))
        ])

        if (studRes?.data) students.value = studRes.data
        if (semRes?.data) semesters.value = semRes.data
        if (classRes?.data) classrooms.value = classRes.data

        isLoadedFilters.value = true

        // Auto select active semester
        if (!selectedSemesterId.value && semesters.value.length) {
          const activeSem = semesters.value.find(s => s.isActive)
          if (activeSem) selectedSemesterId.value = activeSem.id
        }
      } catch (err) {
        console.error('[AiAnalysisStore] Gagal mengambil filter analisis:', err)
      } finally {
        loadingFilters.value = false
        filtersPromise = null
      }
    })()

    return filtersPromise
  }

  // ── Action: Analyze Student (SWR Pattern & Caching) ────────────────────
  async function analyzeStudent(studentIdVal?: string, semesterIdVal?: string, forceRefresh = false) {
    const studentId = studentIdVal || selectedStudentId.value
    const semesterId = semesterIdVal || selectedSemesterId.value

    if (!studentId) return null

    const cacheKey = `${studentId}__${semesterId || 'active'}`
    const cached = studentAnalysisCache.value[cacheKey]
    const now = Date.now()
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS)

    // 1. SWR Cache Hit: Tampilkan langsung seketika (0 ms)
    if (isCacheValid && !forceRefresh) {
      currentStudentAnalysis.value = cached
      return cached
    }

    // Jika ada cached data meskipun stale, tampilkan langsung
    if (cached && !forceRefresh) {
      currentStudentAnalysis.value = cached
    }

    // In-flight deduplication
    if (studentPromises.has(cacheKey)) {
      return studentPromises.get(cacheKey)
    }

    isAnalyzingStudent.value = true

    const promise = (async () => {
      try {
        const res = await $fetch<{ data: any, cached: boolean, generatedAt: string }>('/api/ai/analyze-student', {
          method: 'POST',
          body: {
            studentId,
            semesterId: semesterId || undefined,
            forceRefresh
          },
          credentials: 'include'
        })

        const itemResult: AIAnalysisResult = {
          data: res.data,
          cached: res.cached,
          generatedAt: new Date(res.generatedAt).toLocaleString('id-ID'),
          timestamp: Date.now()
        }

        studentAnalysisCache.value[cacheKey] = itemResult
        currentStudentAnalysis.value = itemResult
        return itemResult
      } finally {
        isAnalyzingStudent.value = false
        studentPromises.delete(cacheKey)
      }
    })()

    studentPromises.set(cacheKey, promise)
    return promise
  }

  // ── Action: Analyze Class (SWR Pattern & Caching) ──────────────────────
  async function analyzeClass(classroomIdVal?: string, semesterIdVal?: string, forceRefresh = false) {
    const classroomId = classroomIdVal || selectedClassroomId.value
    const semesterId = semesterIdVal || selectedSemesterId.value

    if (!classroomId) return null

    const cacheKey = `${classroomId}__${semesterId || 'active'}`
    const cached = classAnalysisCache.value[cacheKey]
    const now = Date.now()
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS)

    // 1. SWR Cache Hit: Tampilkan langsung seketika (0 ms)
    if (isCacheValid && !forceRefresh) {
      currentClassAnalysis.value = cached
      return cached
    }

    if (cached && !forceRefresh) {
      currentClassAnalysis.value = cached
    }

    if (classPromises.has(cacheKey)) {
      return classPromises.get(cacheKey)
    }

    isAnalyzingClass.value = true

    const promise = (async () => {
      try {
        const res = await $fetch<{ data: any, cached?: boolean, generatedAt?: string }>('/api/ai/analyze-class', {
          method: 'POST',
          body: {
            classroomId,
            semesterId: semesterId || undefined,
            forceRefresh
          },
          credentials: 'include'
        })

        const itemResult: AIAnalysisResult = {
          data: res.data,
          cached: res.cached ?? false,
          generatedAt: new Date(res.generatedAt ?? Date.now()).toLocaleString('id-ID'),
          timestamp: Date.now()
        }

        classAnalysisCache.value[cacheKey] = itemResult
        currentClassAnalysis.value = itemResult
        return itemResult
      } finally {
        isAnalyzingClass.value = false
        classPromises.delete(cacheKey)
      }
    })()

    classPromises.set(cacheKey, promise)
    return promise
  }

  // ── Action: Analyze Subject (Teacher View) ─────────────────────────────
  async function analyzeSubject(teachingId: string, forceRefresh = false) {
    if (!teachingId) return null

    const cacheKey = teachingId
    const cached = subjectAnalysisCache.value[cacheKey]
    const now = Date.now()
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS)

    if (isCacheValid && !forceRefresh) {
      currentSubjectAnalysis.value = cached
      return cached
    }

    if (cached && !forceRefresh) {
      currentSubjectAnalysis.value = cached
    }

    if (subjectPromises.has(cacheKey)) {
      return subjectPromises.get(cacheKey)
    }

    isAnalyzingSubject.value = true

    const promise = (async () => {
      try {
        const res = await $fetch<{ data: any, cached: boolean, generatedAt: string }>('/api/ai/analyze-subject', {
          method: 'POST',
          body: {
            teachingId,
            forceRefresh
          },
          credentials: 'include'
        })

        const itemResult: AIAnalysisResult = {
          data: res.data,
          cached: res.cached,
          generatedAt: new Date(res.generatedAt).toLocaleString('id-ID'),
          timestamp: Date.now()
        }

        subjectAnalysisCache.value[cacheKey] = itemResult
        currentSubjectAnalysis.value = itemResult
        return itemResult
      } finally {
        isAnalyzingSubject.value = false
        subjectPromises.delete(cacheKey)
      }
    })()

    subjectPromises.set(cacheKey, promise)
    return promise
  }

  function clearCache() {
    studentAnalysisCache.value = {}
    classAnalysisCache.value = {}
    subjectAnalysisCache.value = {}
    currentStudentAnalysis.value = null
    currentClassAnalysis.value = null
    currentSubjectAnalysis.value = null
  }

  return {
    // State: Filters
    students,
    semesters,
    classrooms,
    isLoadedFilters,
    loadingFilters,
    selectedStudentId,
    selectedSemesterId,
    selectedClassroomId,

    // State: Outputs
    currentStudentAnalysis,
    currentClassAnalysis,
    currentSubjectAnalysis,
    isAnalyzingStudent,
    isAnalyzingClass,
    isAnalyzingSubject,

    // State: Caches
    studentAnalysisCache,
    classAnalysisCache,
    subjectAnalysisCache,

    // Computed
    studentOptions,
    semesterOptions,
    classroomOptions,

    // Methods
    fetchFilters,
    analyzeStudent,
    analyzeClass,
    analyzeSubject,
    clearCache
  }
})
