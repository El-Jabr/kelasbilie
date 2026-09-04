import { defineStore } from 'pinia'

export const useAssignmentStore = defineStore('assignment', () => {
  // State: Teaching Assignments
  const teachingAssignments = ref<any[]>([])
  const teachers = ref<any[]>([])
  const subjects = ref<any[]>([])
  const classes = ref<any[]>([])
  const semesters = ref<any[]>([])
  const courses = ref<any[]>([])

  // State: Homerooms
  const homerooms = ref<any[]>([])
  const homeroomPagination = ref({
    page: 1,
    limit: 100, // Fetch ample records for grid view
    total: 0,
    pages: 1
  })

  // Selected item states
  const selectedAssignment = ref<any | null>(null)
  const selectedHomeroom = ref<any | null>(null)

  // Loading & Cache flags
  const isLoadedTeaching = ref(false)
  const isLoadedHomeroom = ref(false)
  const loadingTA = ref(false)
  const loadingHR = ref(false)

  // In-flight promise tracking for deduplication
  let teachingFetchPromise: Promise<void> | null = null
  let homeroomFetchPromise: Promise<void> | null = null

  // ── Action: Fetch Teaching Assignments ─────────────────────────────────
  async function fetchTeachingAssignments(force = false) {
    // If already loaded and not forced, do nothing
    if (isLoadedTeaching.value && !force) {
      return
    }

    if (teachingFetchPromise) {
      return teachingFetchPromise
    }

    loadingTA.value = true

    teachingFetchPromise = (async () => {
      try {
        const [asRes, tRes, sRes, cRes, semRes, coRes]: any = await Promise.all([
          $fetch('/api/teaching-assignments?limit=200', { credentials: 'include' }),
          $fetch('/api/teachers', { credentials: 'include' }),
          $fetch('/api/subjects', { credentials: 'include' }),
          $fetch('/api/classes', { credentials: 'include' }),
          $fetch('/api/semesters', { credentials: 'include' }),
          $fetch('/api/moodle', { credentials: 'include' }).catch(() => ({ data: [] }))
        ])

        if (asRes?.data) teachingAssignments.value = asRes.data
        if (tRes?.data) teachers.value = tRes.data
        if (sRes?.data) subjects.value = sRes.data
        if (cRes?.data) classes.value = cRes.data
        if (semRes?.data) semesters.value = semRes.data
        if (coRes?.data) courses.value = coRes.data

        isLoadedTeaching.value = true
      } catch (err) {
        console.error('[AssignmentStore] Gagal mengambil data penugasan mengajar:', err)
      } finally {
        loadingTA.value = false
        teachingFetchPromise = null
      }
    })()

    return teachingFetchPromise
  }

  // ── Action: Fetch Homerooms ────────────────────────────────────────────
  async function fetchHomerooms(force = false, filter?: { semesterId?: string, classroomId?: string, teacherId?: string }) {
    if (isLoadedHomeroom.value && !force && !filter) {
      return
    }

    if (homeroomFetchPromise) {
      return homeroomFetchPromise
    }

    loadingHR.value = true

    homeroomFetchPromise = (async () => {
      try {
        const response: any = await $fetch('/api/homerooms', {
          credentials: 'include',
          query: {
            page: 1,
            limit: homeroomPagination.value.limit,
            semesterId: filter?.semesterId || undefined,
            classroomId: filter?.classroomId || undefined,
            teacherId: filter?.teacherId || undefined
          }
        })

        if (response?.data) {
          homerooms.value = response.data
          if (response.pagination) {
            homeroomPagination.value = response.pagination
          }
        }

        isLoadedHomeroom.value = true
      } catch (err) {
        console.error('[AssignmentStore] Gagal mengambil data wali kelas:', err)
      } finally {
        loadingHR.value = false
        homeroomFetchPromise = null
      }
    })()

    return homeroomFetchPromise
  }

  // ── Action: Refresh All ────────────────────────────────────────────────
  async function refreshAll() {
    await Promise.all([
      fetchTeachingAssignments(true),
      fetchHomerooms(true)
    ])
  }

  // ── Computed Options ───────────────────────────────────────────────────
  const teacherOptions = computed(() => teachers.value.map((t: any) => ({
    value: t.id,
    label: `${t.user?.fullname || 'Guru'} (NIP: ${t.nip || '-'})`
  })))

  const subjectOptions = computed(() => subjects.value.map((s: any) => ({
    value: s.id,
    label: `${s.name} (${s.code})`
  })))

  const classOptions = computed(() => classes.value.map((c: any) => ({
    value: c.id,
    label: `${c.name} (Level ${c.level})`
  })))

  const semesterOptions = computed(() => semesters.value.map((sem: any) => ({
    value: sem.id,
    label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
  })))

  const courseOptions = computed(() => courses.value.map((co: any) => ({
    value: co.id,
    label: `${co.fullname} (ID: ${co.id})`
  })))

  return {
    // State
    teachingAssignments,
    teachers,
    subjects,
    classes,
    semesters,
    courses,
    homerooms,
    homeroomPagination,
    selectedAssignment,
    selectedHomeroom,
    isLoadedTeaching,
    isLoadedHomeroom,
    loadingTA,
    loadingHR,

    // Computed Options
    teacherOptions,
    subjectOptions,
    classOptions,
    semesterOptions,
    courseOptions,

    // Actions
    fetchTeachingAssignments,
    fetchHomerooms,
    refreshAll
  }
})
