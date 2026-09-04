import { defineStore } from 'pinia'

export interface MoodleCourse {
  id: number | string
  fullname?: string
  shortname?: string
  categoryId?: number | string
  category?: { name?: string }
  visible?: boolean
  lastSync?: string
  [key: string]: unknown
}

export interface MoodleLogItem {
  id: string | number
  resource: string
  action: string
  status: string
  message?: string
  details?: Record<string, unknown>
  createdAt: string
  [key: string]: unknown
}

export interface MoodleClassroomOption {
  value: string
  label: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit cache TTL

export const useMoodleStore = defineStore('moodle', () => {
  // ── 1. State: Courses ──────────────────────────────────────────────────
  const courses = ref<MoodleCourse[]>([])
  const isLoadedCourses = ref<boolean>(false)
  const loadingCourses = ref<boolean>(false)
  const coursesLastFetched = ref<number>(0)
  const courseSearch = ref<string>('')
  const coursePage = ref<number>(1)
  const coursePageCount = ref<number>(10)

  // ── 2. State: Logs ─────────────────────────────────────────────────────
  const logs = ref<MoodleLogItem[]>([])
  const isLoadedLogs = ref<boolean>(false)
  const loadingLogs = ref<boolean>(false)
  const logsLastFetched = ref<number>(0)

  // ── 3. State: Classrooms Dropdown ──────────────────────────────────────
  const classroomOptions = ref<MoodleClassroomOption[]>([])
  const isLoadedClassrooms = ref<boolean>(false)

  // ── 4. State: Sync Progress & Action States ────────────────────────────
  const isSyncingCourse = ref<boolean>(false)
  const syncingResource = ref<string | null>(null)
  const isExportingUsers = ref<boolean>(false)
  const isUpdatingPasswords = ref<boolean>(false)
  const exportTargetRole = ref<'ALL' | 'TEACHER' | 'STUDENT'>('ALL')
  const autoEnrollCourses = ref<boolean>(true)
  const defaultPassword = ref<string>('Password123!')
  const exportSummary = ref<Record<string, unknown> | null>(null)
  const passwordMode = ref<'HARIAN' | 'EXAM_STS_SAS'>('HARIAN')
  const passwordClassroomId = ref<string>('ALL')
  const passwordUpdateSummary = ref<Record<string, unknown> | null>(null)

  // ── 5. In-flight Promises for Request Deduplication ────────────────────
  let coursesPromise: Promise<MoodleCourse[]> | null = null
  let logsPromise: Promise<MoodleLogItem[]> | null = null
  let classroomsPromise: Promise<MoodleClassroomOption[]> | null = null

  // ── Action: Fetch Courses (SWR Pattern) ────────────────────────────────
  async function fetchCourses(force = false): Promise<MoodleCourse[]> {
    const now = Date.now()
    const isCacheValid = isLoadedCourses.value && (now - coursesLastFetched.value < CACHE_TTL_MS)

    if (!force && isCacheValid && courses.value.length > 0) {
      return courses.value
    }

    if (coursesPromise) {
      return coursesPromise
    }

    // Jika sudah ada data, jangan tampilkan spinner penuh (SWR)
    if (courses.value.length === 0) {
      loadingCourses.value = true
    }

    coursesPromise = (async () => {
      try {
        const res = await $fetch<{ data: MoodleCourse[] }>('/api/moodle', {
          credentials: 'include'
        })
        if (res?.data) {
          courses.value = res.data
          isLoadedCourses.value = true
          coursesLastFetched.value = Date.now()
        }
        return courses.value
      } catch (err) {
        console.error('[MoodleStore] Gagal mengambil data courses Moodle:', err)
        throw err
      } finally {
        loadingCourses.value = false
        coursesPromise = null
      }
    })()

    return coursesPromise
  }

  // ── Action: Fetch Logs (SWR Pattern) ───────────────────────────────────
  async function fetchLogs(force = false, limit = 15): Promise<MoodleLogItem[]> {
    const now = Date.now()
    const isCacheValid = isLoadedLogs.value && (now - logsLastFetched.value < 60 * 1000) // 1 menit untuk logs

    if (!force && isCacheValid && logs.value.length > 0) {
      return logs.value
    }

    if (logsPromise) {
      return logsPromise
    }

    if (logs.value.length === 0) {
      loadingLogs.value = true
    }

    logsPromise = (async () => {
      try {
        const res = await $fetch<{ data?: MoodleLogItem[] }>(`/api/moodle/logs?limit=${limit}`, {
          credentials: 'include'
        })
        if (res?.data) {
          logs.value = res.data
          isLoadedLogs.value = true
          logsLastFetched.value = Date.now()
        }
        return logs.value
      } catch (err) {
        console.error('[MoodleStore] Gagal mengambil logs Moodle:', err)
        throw err
      } finally {
        loadingLogs.value = false
        logsPromise = null
      }
    })()

    return logsPromise
  }

  // ── Action: Fetch Classroom Options ────────────────────────────────────
  async function fetchClassrooms(force = false): Promise<MoodleClassroomOption[]> {
    if (!force && isLoadedClassrooms.value && classroomOptions.value.length > 0) {
      return classroomOptions.value
    }

    if (classroomsPromise) {
      return classroomsPromise
    }

    classroomsPromise = (async () => {
      try {
        const res = await $fetch<{ data?: { id: string, name: string, level: string | number }[] }>('/api/classes', {
          credentials: 'include'
        })
        if (res?.data) {
          classroomOptions.value = [
            { value: 'ALL', label: 'Semua Kelas' },
            ...(res.data || []).map((c: { id: string, name: string, level: string | number }) => ({
              value: c.id,
              label: `${c.name} (Tingkat ${c.level})`
            }))
          ]
          isLoadedClassrooms.value = true
        }
        return classroomOptions.value
      } catch (err) {
        console.error('[MoodleStore] Gagal memuat dropdown kelas:', err)
        return classroomOptions.value
      } finally {
        classroomsPromise = null
      }
    })()

    return classroomsPromise
  }

  // ── Action: Sync Courses from Moodle ───────────────────────────────────
  async function syncCourses(): Promise<{ message?: string }> {
    isSyncingCourse.value = true
    try {
      const res = await $fetch<{ message?: string }>('/api/moodle?resource=COURSE', {
        method: 'POST',
        credentials: 'include'
      })
      // Refresh courses and logs
      await Promise.all([fetchCourses(true), fetchLogs(true)])
      return res
    } finally {
      isSyncingCourse.value = false
    }
  }

  // ── Action: Trigger Resource Sync ──────────────────────────────────────
  async function triggerSyncResource(resource: string): Promise<{ message?: string }> {
    syncingResource.value = resource
    try {
      const res = await $fetch<{ message?: string }>(`/api/moodle?resource=${resource}`, {
        method: 'POST',
        credentials: 'include'
      })
      if (resource === 'COURSE' || resource === 'ALL') {
        fetchCourses(true)
      }
      await fetchLogs(true)
      return res
    } finally {
      syncingResource.value = null
    }
  }

  // ── Action: Export Users ───────────────────────────────────────────────
  async function exportUsers(payload?: {
    targetRole?: 'ALL' | 'TEACHER' | 'STUDENT'
    autoEnroll?: boolean
    defaultPassword?: string
  }): Promise<{ message?: string, summary?: Record<string, unknown> }> {
    isExportingUsers.value = true
    exportSummary.value = null
    try {
      const res = await $fetch<{ message?: string, summary?: Record<string, unknown> }>('/api/moodle/export-users', {
        method: 'POST',
        body: {
          targetRole: payload?.targetRole ?? exportTargetRole.value,
          autoEnroll: payload?.autoEnroll ?? autoEnrollCourses.value,
          defaultPassword: payload?.defaultPassword ?? defaultPassword.value
        },
        credentials: 'include'
      })
      if (res.summary) {
        exportSummary.value = res.summary
      }
      await fetchLogs(true)
      return res
    } finally {
      isExportingUsers.value = false
    }
  }

  // ── Action: Update Passwords ───────────────────────────────────────────
  async function updatePasswords(payload?: {
    mode?: 'HARIAN' | 'EXAM_STS_SAS'
    classroomId?: string
  }): Promise<{ message?: string, summary?: Record<string, unknown> }> {
    isUpdatingPasswords.value = true
    passwordUpdateSummary.value = null
    try {
      const res = await $fetch<{ message?: string, summary?: Record<string, unknown> }>('/api/moodle/update-passwords', {
        method: 'POST',
        body: {
          mode: payload?.mode ?? passwordMode.value,
          classroomId: payload?.classroomId ?? passwordClassroomId.value
        },
        credentials: 'include'
      })
      if (res.summary) {
        passwordUpdateSummary.value = res.summary
      }
      await fetchLogs(true)
      return res
    } finally {
      isUpdatingPasswords.value = false
    }
  }

  function invalidateCourses() {
    isLoadedCourses.value = false
    coursesLastFetched.value = 0
  }

  function invalidateLogs() {
    isLoadedLogs.value = false
    logsLastFetched.value = 0
  }

  return {
    // State: Courses
    courses,
    isLoadedCourses,
    loadingCourses,
    courseSearch,
    coursePage,
    coursePageCount,

    // State: Logs
    logs,
    isLoadedLogs,
    loadingLogs,

    // State: Classrooms
    classroomOptions,
    isLoadedClassrooms,

    // State: Actions
    isSyncingCourse,
    syncingResource,
    isExportingUsers,
    isUpdatingPasswords,
    exportTargetRole,
    autoEnrollCourses,
    defaultPassword,
    exportSummary,
    passwordMode,
    passwordClassroomId,
    passwordUpdateSummary,

    // Methods
    fetchCourses,
    fetchLogs,
    fetchClassrooms,
    syncCourses,
    triggerSyncResource,
    exportUsers,
    updatePasswords,
    invalidateCourses,
    invalidateLogs
  }
})
