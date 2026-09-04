import { defineStore } from 'pinia'

export interface GradeDropdownOption {
  label: string
  value: string
}

export interface CachedInspection {
  data: any
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit cache TTL

export const useGradesStore = defineStore('grades', () => {
  // ── 1. State: Filter & Pagination (Preserved across page transitions) ────
  const selectedClassroomId = ref<string>('ALL')
  const selectedTeachingId = ref<string>('ALL')
  const searchInput = ref<string>('')
  const currentPage = ref<number>(1)
  const itemsPerPage = ref<number>(10)

  // ── 2. State: Dropdown Options & Cached Data ────────────────────────────
  const classrooms = ref<any[]>([])
  const isLoadedClassrooms = ref<boolean>(false)
  const pendingDropdowns = ref<boolean>(false)

  // Map: classroomId -> DropdownOption[]
  const teachingsByClassroom = ref<Record<string, GradeDropdownOption[]>>({})

  // Active Inspection Data & Cache
  const currentInspection = ref<any>(null)
  const inspectionCache = ref<Record<string, CachedInspection>>({})

  // Loading States
  const pending = ref<boolean>(false)
  const isSyncingMoodle = ref<boolean>(false)

  // In-flight Promise Tracking for Deduplication
  let classroomsPromise: Promise<void> | null = null
  const teachingsPromises = new Map<string, Promise<GradeDropdownOption[]>>()
  const inspectionPromises = new Map<string, Promise<any>>()

  // ── Helper: Helper to safely extract string ID ─────────────────────────
  function extractId(val: any): string {
    if (!val) return 'ALL'
    if (typeof val === 'object') return val.value || val.id || 'ALL'
    return String(val)
  }

  // ── Computed Options ───────────────────────────────────────────────────
  const classroomOptions = computed<GradeDropdownOption[]>(() => {
    return [
      { label: '-- Pilih Kelas --', value: 'ALL' },
      ...classrooms.value.map((c: any) => ({
        label: `Kelas ${c.name} (Tingkat ${c.level})`,
        value: c.id
      }))
    ]
  })

  const currentTeachingOptions = computed<GradeDropdownOption[]>(() => {
    const cid = extractId(selectedClassroomId.value)
    if (!cid || cid === 'ALL') {
      return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
    }
    return teachingsByClassroom.value[cid] || [
      { label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }
    ]
  })

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
        const res: any = await $fetch('/api/classes', { credentials: 'include' })
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
  async function fetchTeachingsForClassroom(classroomIdVal: any, force = false): Promise<GradeDropdownOption[]> {
    const cid = extractId(classroomIdVal)
    if (!cid || cid === 'ALL') {
      return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
    }

    if (!force && teachingsByClassroom.value[cid]?.length) {
      return teachingsByClassroom.value[cid]
    }

    if (teachingsPromises.has(cid)) {
      return teachingsPromises.get(cid)!
    }

    const promise = (async () => {
      try {
        let activeSemId: string | undefined
        try {
          const activeSem: any = await $fetch('/api/semesters/active')
          activeSemId = activeSem?.data?.id
        } catch {
          // Fallback
        }

        const res: any = await $fetch('/api/teaching-assignments', {
          query: {
            classroomId: cid,
            ...(activeSemId ? { semesterId: activeSemId } : { activeSemester: 'true' }),
            limit: 100
          },
          credentials: 'include'
        })

        const options: GradeDropdownOption[] = [
          { label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' },
          ...(res?.data || []).map((t: any) => ({
            label: `${t.subject?.code} - ${t.subject?.name} (${t.teacher?.user?.fullname || 'No Teacher'})`,
            value: t.id
          }))
        ]

        teachingsByClassroom.value[cid] = options
        return options
      } catch (err) {
        console.error(`[GradesStore] Gagal memuat mata pelajaran kelas ${cid}:`, err)
        return [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
      } finally {
        teachingsPromises.delete(cid)
      }
    })()

    teachingsPromises.set(cid, promise)
    return promise
  }

  // ── Helper: Cache Key Generator ────────────────────────────────────────
  function getCacheKey(classroomId: string, teachingId: string, search: string): string {
    const c = extractId(classroomId)
    const t = extractId(teachingId)
    const s = (search || '').trim().toLowerCase()
    return `${c}__${t}__${s}`
  }

  // ── Action: Fetch Inspection Data (SWR Pattern) ────────────────────────
  async function fetchInspection(
    classroomIdVal?: any,
    teachingIdVal?: any,
    searchVal?: string,
    force = false
  ) {
    const cid = extractId(classroomIdVal !== undefined ? classroomIdVal : selectedClassroomId.value)
    const tid = extractId(teachingIdVal !== undefined ? teachingIdVal : selectedTeachingId.value)
    const search = searchVal !== undefined ? searchVal : searchInput.value

    if (!cid || cid === 'ALL') {
      currentInspection.value = null
      pending.value = false
      return null
    }

    const cacheKey = getCacheKey(cid, tid, search)
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
        const res: any = await $fetch('/api/grades/inspection', {
          query: {
            classroomId: cid,
            teachingId: tid,
            search: search || undefined
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
          searchInput.value
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
      for (const key of Object.keys(inspectionCache.value)) {
        if (key.startsWith(`${cid}__`)) {
          delete inspectionCache.value[key]
        }
      }
    } else {
      inspectionCache.value = {}
    }
  }

  // ── Action: Reset Filters ──────────────────────────────────────────────
  function resetFilter() {
    selectedClassroomId.value = 'ALL'
    selectedTeachingId.value = 'ALL'
    searchInput.value = ''
    currentPage.value = 1
    currentInspection.value = null
    pending.value = false
  }

  return {
    // State
    selectedClassroomId,
    selectedTeachingId,
    searchInput,
    currentPage,
    itemsPerPage,
    classrooms,
    isLoadedClassrooms,
    pendingDropdowns,
    teachingsByClassroom,
    currentInspection,
    inspectionCache,
    pending,
    isSyncingMoodle,

    // Computed
    classroomOptions,
    currentTeachingOptions,

    // Actions & Methods
    extractId,
    fetchClassrooms,
    fetchTeachingsForClassroom,
    fetchInspection,
    invalidateCache,
    resetFilter
  }
})
