import { storeToRefs } from 'pinia'
import { useAcademicStore } from '~~/app/stores/academic'

export function useClasses() {
  const store = useAcademicStore()
  const {
    classes,
    paginationCl: pagination,
    loadingCl: loading,
    searchCl: search,
    levelCl: level,
    sortCl: sort,
    orderCl: order,
    selectedClass
  } = storeToRefs(store)

  async function fetchClasses(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchClasses(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchClasses(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchClasses(true, page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await store.fetchClasses(true, 1)
  }

  async function resetFilter() {
    search.value = ''
    level.value = ''
    sort.value = 'name'
    order.value = 'asc'
    await store.fetchClasses(true, 1)
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
    resetFilter
  }
}
