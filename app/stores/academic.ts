import { defineStore } from 'pinia'
import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'
import type { SemesterSchema } from '~~/shared/schemas/semester'
import type { ClassSchema } from '~~/shared/schemas/class'
import type { SubjectSchema } from '~~/shared/schemas/subject'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export const useAcademicStore = defineStore('academic', () => {
  // ── 1. ACADEMIC YEARS ───────────────────────────────────────────────────
  const academicYears = ref<AcademicYearSchema[]>([])
  const paginationAY = ref<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 })
  const loadingAY = ref(false)
  const isLoadedAY = ref(false)
  const searchAY = ref('')
  const activeAY = ref<string>('ALL')
  const sortAY = ref('createdAt')
  const orderAY = ref<'asc' | 'desc'>('desc')
  const selectedAcademicYear = ref<AcademicYearSchema | null>(null)

  async function fetchAcademicYears(force = false, page = paginationAY.value.page) {
    if (!isLoadedAY.value || force) {
      loadingAY.value = true
    }

    try {
      const response = await $fetch<PaginatedResponse<AcademicYearSchema>>('/api/academic-years', {
        credentials: 'include',
        query: {
          page,
          limit: paginationAY.value.limit,
          search: searchAY.value || undefined,
          active: activeAY.value === 'ALL' ? undefined : activeAY.value,
          sort: sortAY.value,
          order: orderAY.value
        }
      })

      academicYears.value = response.data
      paginationAY.value = response.pagination
      isLoadedAY.value = true
    } catch (err) {
      console.error('[AcademicStore] Gagal mengambil tahun ajaran:', err)
    } finally {
      loadingAY.value = false
    }
  }

  // ── 2. SEMESTERS ────────────────────────────────────────────────────────
  const semesters = ref<SemesterSchema[]>([])
  const paginationSem = ref<PaginationMeta>({ page: 1, limit: 100, total: 0, pages: 1 })
  const loadingSem = ref(false)
  const isLoadedSem = ref(false)
  const filterAcademicYearId = ref('ALL')
  const activeSem = ref<string>('ALL')
  const selectedSemester = ref<SemesterSchema | null>(null)

  async function fetchSemesters(force = false, page = paginationSem.value.page) {
    if (!isLoadedSem.value || force) {
      loadingSem.value = true
    }

    try {
      const response = await $fetch<PaginatedResponse<SemesterSchema>>('/api/semesters', {
        credentials: 'include',
        query: {
          page,
          limit: paginationSem.value.limit,
          academicYearId: filterAcademicYearId.value === 'ALL' ? undefined : filterAcademicYearId.value,
          active: activeSem.value === 'ALL' ? undefined : activeSem.value
        }
      })

      semesters.value = response.data
      paginationSem.value = response.pagination
      isLoadedSem.value = true
    } catch (err) {
      console.error('[AcademicStore] Gagal mengambil data semester:', err)
    } finally {
      loadingSem.value = false
    }
  }

  // ── 3. CLASSES ──────────────────────────────────────────────────────────
  const classes = ref<ClassSchema[]>([])
  const paginationCl = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, pages: 1 })
  const loadingCl = ref(false)
  const isLoadedCl = ref(false)
  const searchCl = ref('')
  const levelCl = ref('')
  const sortCl = ref('name')
  const orderCl = ref<'asc' | 'desc'>('asc')
  const selectedClass = ref<ClassSchema | null>(null)

  async function fetchClasses(force = false, page = paginationCl.value.page) {
    if (!isLoadedCl.value || force) {
      loadingCl.value = true
    }

    try {
      const response = await $fetch<PaginatedResponse<ClassSchema>>('/api/classes', {
        credentials: 'include',
        query: {
          page,
          limit: paginationCl.value.limit,
          search: searchCl.value || undefined,
          level: levelCl.value || undefined,
          sort: sortCl.value,
          order: orderCl.value
        }
      })

      classes.value = response.data
      paginationCl.value = response.pagination
      isLoadedCl.value = true
    } catch (err) {
      console.error('[AcademicStore] Gagal mengambil data kelas:', err)
    } finally {
      loadingCl.value = false
    }
  }

  // ── 4. SUBJECTS ─────────────────────────────────────────────────────────
  const subjects = ref<SubjectSchema[]>([])
  const paginationSub = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, pages: 1 })
  const loadingSub = ref(false)
  const isLoadedSub = ref(false)
  const searchSub = ref('')
  const sortSub = ref('code')
  const orderSub = ref<'asc' | 'desc'>('asc')
  const selectedSubject = ref<SubjectSchema | null>(null)

  async function fetchSubjects(force = false, page = paginationSub.value.page) {
    if (!isLoadedSub.value || force) {
      loadingSub.value = true
    }

    try {
      const response = await $fetch<PaginatedResponse<SubjectSchema>>('/api/subjects', {
        credentials: 'include',
        query: {
          page,
          limit: paginationSub.value.limit,
          search: searchSub.value || undefined,
          sort: sortSub.value,
          order: orderSub.value
        }
      })

      subjects.value = response.data
      paginationSub.value = response.pagination
      isLoadedSub.value = true
    } catch (err) {
      console.error('[AcademicStore] Gagal mengambil data mapel:', err)
    } finally {
      loadingSub.value = false
    }
  }

  // ── COMPUTED OPTIONS ────────────────────────────────────────────────────
  const classOptions = computed(() => classes.value.map(c => ({
    value: c.id,
    label: `Kelas ${c.name} (Tingkat ${c.level})`
  })))

  const subjectOptions = computed(() => subjects.value.map(s => ({
    value: s.id,
    label: `${s.name} (${s.code})`
  })))

  const semesterOptions = computed(() => semesters.value.map(sem => ({
    value: sem.id,
    label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
  })))

  return {
    // Academic Years
    academicYears,
    paginationAY,
    loadingAY,
    isLoadedAY,
    searchAY,
    activeAY,
    sortAY,
    orderAY,
    selectedAcademicYear,
    fetchAcademicYears,

    // Semesters
    semesters,
    paginationSem,
    loadingSem,
    isLoadedSem,
    filterAcademicYearId,
    activeSem,
    selectedSemester,
    fetchSemesters,

    // Classes
    classes,
    paginationCl,
    loadingCl,
    isLoadedCl,
    searchCl,
    levelCl,
    sortCl,
    orderCl,
    selectedClass,
    fetchClasses,

    // Subjects
    subjects,
    paginationSub,
    loadingSub,
    isLoadedSub,
    searchSub,
    sortSub,
    orderSub,
    selectedSubject,
    fetchSubjects,

    // Computed Options
    classOptions,
    subjectOptions,
    semesterOptions
  }
})
