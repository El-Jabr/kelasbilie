import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useHomerooms() {
  const homerooms = useState<any[]>(
    'homerooms:list',
    () => []
  )

  const pagination = useState<PaginationMeta>(
    'homerooms:pagination',
    () => ({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    })
  )

  const loading = useState(
    'homerooms:loading',
    () => false
  )

  // Filters
  const search = useState(
    'homerooms:search',
    () => ''
  )
  const filterSemesterId = useState(
    'homerooms:filterSemesterId',
    () => ''
  )
  const filterClassroomId = useState(
    'homerooms:filterClassroomId',
    () => ''
  )
  const filterTeacherId = useState(
    'homerooms:filterTeacherId',
    () => ''
  )

  const selectedHomeroom = useState<any | null>(
    'homerooms:selected',
    () => null
  )

  async function fetchHomerooms(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<PaginatedResponse<any>>(
        '/api/homerooms',
        {
          credentials: 'include',
          query: {
            page,
            limit: pagination.value.limit,
            semesterId: filterSemesterId.value || undefined,
            classroomId: filterClassroomId.value || undefined,
            teacherId: filterTeacherId.value || undefined
          }
        }
      )

      homerooms.value = response.data
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    pagination.value.page = 1
    await fetchHomerooms(1)
  }

  async function changePage(page: number) {
    await fetchHomerooms(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchHomerooms(1)
  }

  async function resetFilter() {
    search.value = ''
    filterSemesterId.value = ''
    filterClassroomId.value = ''
    filterTeacherId.value = ''
    await fetchHomerooms(1)
  }

  return {
    homerooms,
    pagination,
    loading,

    search,
    filterSemesterId,
    filterClassroomId,
    filterTeacherId,

    selectedHomeroom,

    fetchHomerooms,
    refresh,
    changePage,
    changeLimit,
    resetFilter
  }
}
