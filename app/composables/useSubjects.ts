import type { SubjectSchema } from '~~/shared/schemas/subject'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useSubjects() {
  const subjects = useState<SubjectSchema[]>(
    'subjects:list',
    () => []
  )

  const pagination = useState<PaginationMeta>(
    'subjects:pagination',
    () => ({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    })
  )

  const loading = useState(
    'subjects:loading',
    () => false
  )

  const search = useState(
    'subjects:search',
    () => ''
  )

  const sort = useState(
    'subjects:sort',
    () => 'code'
  )

  const order = useState<'asc' | 'desc'>(
    'subjects:order',
    () => 'asc'
  )

  const selectedSubject = useState<SubjectSchema | null>(
    'subjects:selected',
    () => null
  )

  async function fetchSubjects(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<PaginatedResponse<SubjectSchema>>(
        '/api/subjects',
        {
          query: {
            page,
            limit: pagination.value.limit,
            search: search.value || undefined,
            sort: sort.value,
            order: order.value
          }
        }
      )

      subjects.value = response.data
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    pagination.value.page = 1
    await fetchSubjects(1)
  }

  async function changePage(page: number) {
    await fetchSubjects(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchSubjects(1)
  }

  async function changeSort(field: string) {
    if (sort.value === field) {
      order.value = order.value === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = field
      order.value = 'asc'
    }

    await fetchSubjects(1)
  }

  async function resetFilter() {
    search.value = ''
    sort.value = 'code'
    order.value = 'asc'

    await fetchSubjects(1)
  }

  return {
    subjects,
    pagination,
    loading,

    search,
    sort,
    order,

    selectedSubject,

    fetchSubjects,
    refresh,
    changePage,
    changeLimit,
    changeSort,
    resetFilter
  }
}
