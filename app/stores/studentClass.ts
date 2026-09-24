import { defineStore } from 'pinia'

export const useStudentClassStore = defineStore('studentClass', () => {
  // ── State: Pembagian Kelas Siswa List & Pagination ─────────────────────
  const studentClasses = ref<any[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
  const page = ref(1)
  const limit = ref(10)
  const searchQuery = ref('')
  const searchInput = ref('')
  const filterSemesterId = ref('ALL')
  const filterClassroomId = ref('ALL')

  const pendingSC = ref(false)
  const isLoadedSC = ref(false)

  // ── State: Supporting Master Data ──────────────────────────────────────
  const students = ref<any[]>([])
  const classes = ref<any[]>([])
  const semesters = ref<any[]>([])
  const isLoadedSupporting = ref(false)

  // ── State: Plotting / Rombel Cache ─────────────────────────────────────
  const unassignedStudents = ref<any[]>([])
  const classMembers = ref<any[]>([])
  const pendingUnassigned = ref(false)
  const pendingMembers = ref(false)

  // In-memory cache for plotting
  const unassignedCache = ref<Record<string, any[]>>({})
  const classMembersCache = ref<Record<string, any[]>>({})

  let supportingFetchPromise: Promise<void> | null = null
  let scFetchPromise: Promise<void> | null = null
  let unassignedPromise: Promise<void> | null = null
  let membersPromise: Promise<void> | null = null

  // ── Action: Load Supporting Master Data ────────────────────────────────
  async function loadSupportingData(force = false) {
    if (isLoadedSupporting.value && !force) return
    if (supportingFetchPromise) return supportingFetchPromise

    supportingFetchPromise = (async () => {
      try {
        const academicStore = useAcademicStore()
        const [stRes]: any = await Promise.all([
          $fetch('/api/students?limit=1000', { credentials: 'include' }).catch(() => ({ data: [] })),
          academicStore.fetchClasses(force),
          academicStore.fetchSemesters(force)
        ])

        if (stRes?.data) students.value = stRes.data
        classes.value = academicStore.classes
        semesters.value = academicStore.semesters

        isLoadedSupporting.value = true
      } catch (err) {
        console.error('[StudentClassStore] Gagal memuat data pendukung:', err)
      } finally {
        supportingFetchPromise = null
      }
    })()

    return supportingFetchPromise
  }

  // ── Action: Refresh Student Classes Table ──────────────────────────────
  async function refreshSC(force?: boolean | unknown) {
    const isForce = force === true
    if (isLoadedSC.value && !isForce) return
    if (scFetchPromise) return scFetchPromise

    if (studentClasses.value.length === 0) {
      pendingSC.value = true
    }

    scFetchPromise = (async () => {
      try {
        const res: any = await $fetch('/api/student-classes', {
          query: {
            page: page.value,
            limit: limit.value,
            search: searchQuery.value,
            semesterId: filterSemesterId.value === 'ALL' ? undefined : filterSemesterId.value,
            classroomId: filterClassroomId.value === 'ALL' ? undefined : filterClassroomId.value
          },
          credentials: 'include'
        })

        if (res) {
          studentClasses.value = res.data || []
          pagination.value = res.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
        }
        isLoadedSC.value = true
      } catch (err) {
        console.error('[StudentClassStore] Gagal mengambil data pembagian kelas:', err)
      } finally {
        pendingSC.value = false
        scFetchPromise = null
      }
    })()

    return scFetchPromise
  }

  // ── Action: Fetch Unassigned Students for Plotting ─────────────────────
  async function fetchUnassigned(semesterId: string, search = '', force = false) {
    if (!semesterId) {
      unassignedStudents.value = []
      return
    }

    const cacheKey = `${semesterId}_${search.trim()}`
    if (unassignedCache.value[cacheKey] && !force) {
      unassignedStudents.value = unassignedCache.value[cacheKey]
      return
    }

    if (unassignedPromise) return unassignedPromise

    if (unassignedStudents.value.length === 0) {
      pendingUnassigned.value = true
    }

    unassignedPromise = (async () => {
      try {
        const res: any = await $fetch('/api/students/unassigned', {
          query: {
            semesterId,
            search: search || undefined
          },
          credentials: 'include'
        })
        const data = res?.data || (Array.isArray(res) ? res : [])
        unassignedStudents.value = data
        unassignedCache.value[cacheKey] = data
      } catch (err) {
        console.error('[StudentClassStore] Gagal mengambil siswa unassigned:', err)
      } finally {
        pendingUnassigned.value = false
        unassignedPromise = null
      }
    })()

    return unassignedPromise
  }

  // ── Action: Fetch Class Members for Plotting ───────────────────────────
  async function fetchClassMembers(classroomId: string, semesterId: string, search = '', force = false) {
    if (!classroomId || !semesterId) {
      classMembers.value = []
      return
    }

    const cacheKey = `${classroomId}_${semesterId}_${search.trim()}`
    if (classMembersCache.value[cacheKey] && !force) {
      classMembers.value = classMembersCache.value[cacheKey]
      return
    }

    if (membersPromise) return membersPromise

    if (classMembers.value.length === 0) {
      pendingMembers.value = true
    }

    membersPromise = (async () => {
      try {
        const res: any = await $fetch('/api/student-classes', {
          query: {
            classroomId,
            semesterId,
            search: search || undefined,
            limit: 300
          },
          credentials: 'include'
        })
        const data = res?.data || (Array.isArray(res) ? res : [])
        classMembers.value = data
        classMembersCache.value[cacheKey] = data
      } catch (err) {
        console.error('[StudentClassStore] Gagal mengambil anggota kelas:', err)
      } finally {
        pendingMembers.value = false
        membersPromise = null
      }
    })()

    return membersPromise
  }

  function clearPlottingCache() {
    unassignedCache.value = {}
    classMembersCache.value = {}
  }

  // ── Computed Dropdown Options ──────────────────────────────────────────
  const studentOptions = computed(() => students.value.map((s: any) => ({
    value: s.id,
    label: `${s.user?.fullname || 'Siswa'} (NIS: ${s.nis || '-'})`
  })))

  const classOptions = computed(() => classes.value.map((c: any) => ({
    value: c.id,
    label: `${c.name} (Level ${c.level})`
  })))

  const filterClassOptions = computed(() => [
    { value: 'ALL', label: 'Semua Kelas' },
    ...classOptions.value
  ])

  const semesterOptions = computed(() => semesters.value.map((sem: any) => ({
    value: sem.id,
    label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
  })))

  const filterSemesterOptions = computed(() => [
    { value: 'ALL', label: 'Semua Semester' },
    ...semesterOptions.value
  ])

  function resetFilter() {
    searchInput.value = ''
    searchQuery.value = ''
    filterSemesterId.value = 'ALL'
    filterClassroomId.value = 'ALL'
    page.value = 1
  }

  return {
    // State
    studentClasses,
    pagination,
    page,
    limit,
    searchQuery,
    searchInput,
    filterSemesterId,
    filterClassroomId,
    pendingSC,
    isLoadedSC,

    // Master Data
    students,
    classes,
    semesters,
    isLoadedSupporting,

    // Plotting Data
    unassignedStudents,
    classMembers,
    pendingUnassigned,
    pendingMembers,

    // Computed Options
    studentOptions,
    classOptions,
    filterClassOptions,
    semesterOptions,
    filterSemesterOptions,

    // Actions
    loadSupportingData,
    refreshSC,
    fetchUnassigned,
    fetchClassMembers,
    clearPlottingCache,
    resetFilter
  }
})
