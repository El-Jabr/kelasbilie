import type { SemesterSchema } from '~~/shared/schemas/semester'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useSemesters() {
  // State
  const semesters = useState<SemesterSchema[]>(
    'semesters:list',
    () => []
  )

  const pagination = useState<PaginationMeta>(
    'semesters:pagination',
    () => ({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    })
  )

  const loading = useState(
    'semesters:loading',
    () => false
  )

  // Filter
  const academicYearId = useState(
    'semesters:academic-year',
    () => ''
  )

  const active = useState<string>(
    'semesters:active',
    () => 'ALL'
  )

  // Selection
  const selectedSemester = useState<SemesterSchema | null>(
    'semesters:selected',
    () => null
  )

  async function fetchSemesters(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<PaginatedResponse<SemesterSchema>>(
        '/api/semesters',
        {
          query: {
            page,
            limit: pagination.value.limit,
            academicYearId: academicYearId.value || undefined,
            active: active.value === 'ALL'
              ? undefined
              : active.value
          }
        }
      )

      semesters.value = response.data
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    pagination.value.page = 1
    await fetchSemesters(1)
  }

  async function changePage(page: number) {
    await fetchSemesters(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchSemesters(1)
  }

  async function resetFilter() {
    academicYearId.value = ''
    active.value = 'ALL'

    await fetchSemesters(1)
  }

  return {
    // data
    semesters,
    pagination,
    loading,

    // filter
    academicYearId,
    active,

    // selection
    selectedSemester,

    // methods
    fetchSemesters,
    refresh,
    changePage,
    changeLimit,
    resetFilter
  }
}
