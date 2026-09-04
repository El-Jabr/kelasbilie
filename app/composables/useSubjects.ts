import { storeToRefs } from 'pinia'
import { useAcademicStore } from '~~/app/stores/academic'

export function useSubjects() {
  const store = useAcademicStore()
  const {
    subjects,
    paginationSub: pagination,
    loadingSub: loading,
    searchSub: search,
    sortSub: sort,
    orderSub: order,
    selectedSubject
  } = storeToRefs(store)

  async function fetchSubjects(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchSubjects(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchSubjects(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchSubjects(true, page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await store.fetchSubjects(true, 1)
  }

  async function resetFilter() {
    search.value = ''
    sort.value = 'code'
    order.value = 'asc'
    await store.fetchSubjects(true, 1)
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
    resetFilter
  }
}
