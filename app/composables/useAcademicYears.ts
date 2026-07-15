import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useAcademicYears() {
  // State
  const academicYears = useState<AcademicYearSchema[]>(
    'academic-years:list',
    () => []
  )

  const pagination = useState<PaginationMeta>(
    'academic-years:pagination',
    () => ({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    })
  )

  const loading = useState(
    'academic-years:loading',
    () => false
  )

  // Filter
  const search = useState(
    'academic-years:search',
    () => ''
  )

  const active = useState<string>(
    'academic-years:active',
    () => 'ALL'
  )

  // Sorting
  const sort = useState(
    'academic-years:sort',
    () => 'startYear'
  )

  const order = useState<'asc' | 'desc'>(
    'academic-years:order',
    () => 'desc'
  )

  const selectedAcademicYear = useState<AcademicYearSchema | null>(
    'academic-years:selected',
    () => null
  )

  async function fetchAcademicYears(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<PaginatedResponse<AcademicYearSchema>>(
        '/api/academic-years',
        {
          query: {
            page,
            limit: pagination.value.limit,
            search: search.value || undefined,
            active: active.value || undefined,
            sort: sort.value,
            order: order.value
          }
        }
      )

      academicYears.value = response.data
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    pagination.value.page = 1
    await fetchAcademicYears(1)
  }

  async function changePage(page: number) {
    await fetchAcademicYears(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchAcademicYears(1)
  }

  async function changeSort(field: string) {
    if (sort.value === field) {
      order.value = order.value === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = field
      order.value = 'asc'
    }

    await fetchAcademicYears(1)
  }

  async function resetFilter() {
    search.value = ''
    active.value = 'ALL'
    sort.value = 'startYear'
    order.value = 'desc'

    await fetchAcademicYears(1)
  }

  return {
    // data
    academicYears,
    pagination,
    loading,

    // filter
    search,
    active,

    // sorting
    sort,
    order,

    // selection
    selectedAcademicYear,

    // methods
    fetchAcademicYears,
    refresh,
    changePage,
    changeLimit,
    changeSort,
    resetFilter
  }
}
