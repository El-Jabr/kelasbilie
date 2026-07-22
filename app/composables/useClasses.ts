import type { ClassSchema } from '~~/shared/schemas/class'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useClasses() {
  const classes = useState<ClassSchema[]>(
    'classes:list',
    () => []
  )

  const pagination = useState<PaginationMeta>(
    'classes:pagination',
    () => ({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    })
  )

  const loading = useState(
    'classes:loading',
    () => false
  )

  const search = useState(
    'classes:search',
    () => ''
  )

  const level = useState(
    'classes:level',
    () => ''
  )

  const sort = useState(
    'classes:sort',
    () => 'name'
  )

  const order = useState<'asc' | 'desc'>(
    'classes:order',
    () => 'asc'
  )

  const selectedClass = useState<ClassSchema | null>(
    'classes:selected',
    () => null
  )

  async function fetchClasses(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<PaginatedResponse<ClassSchema>>(
        '/api/classes',
        {
          query: {
            page,
            limit: pagination.value.limit,
            search: search.value || undefined,
            level: level.value || undefined,
            sort: sort.value,
            order: order.value
          }
        }
      )

      classes.value = response.data
      console.log('data kelas', classes.value)
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    pagination.value.page = 1
    await fetchClasses(1)
  }

  async function changePage(page: number) {
    await fetchClasses(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchClasses(1)
  }

  async function changeSort(field: string) {
    if (sort.value === field) {
      order.value = order.value === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = field
      order.value = 'asc'
    }

    await fetchClasses(1)
  }

  async function resetFilter() {
    search.value = ''
    level.value = ''
    sort.value = 'name'
    order.value = 'asc'

    await fetchClasses(1)
  }

  return {
    classes,
    pagination,
    loading,

    search,
    level,

    sort,
    order,

    selectedClass,

    fetchClasses,
    refresh,
    changePage,
    changeLimit,
    changeSort,
    resetFilter
  }
}
