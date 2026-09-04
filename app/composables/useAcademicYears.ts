import { storeToRefs } from 'pinia'
import { useAcademicStore } from '~~/app/stores/academic'

export function useAcademicYears() {
  const store = useAcademicStore()
  const {
    academicYears,
    paginationAY: pagination,
    loadingAY: loading,
    searchAY: search,
    activeAY: active,
    sortAY: sort,
    orderAY: order,
    selectedAcademicYear
  } = storeToRefs(store)

  async function fetchAcademicYears(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchAcademicYears(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchAcademicYears(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchAcademicYears(true, page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await store.fetchAcademicYears(true, 1)
  }

  async function resetFilter() {
    search.value = ''
    active.value = 'ALL'
    sort.value = 'createdAt'
    order.value = 'desc'
    await store.fetchAcademicYears(true, 1)
  }

  return {
    academicYears,
    pagination,
    loading,
    search,
    active,
    sort,
    order,
    selectedAcademicYear,
    fetchAcademicYears,
    refresh,
    changePage,
    changeLimit,
    resetFilter
  }
}
