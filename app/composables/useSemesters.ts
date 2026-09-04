import { storeToRefs } from 'pinia'
import { useAcademicStore } from '~~/app/stores/academic'

export function useSemesters() {
  const store = useAcademicStore()
  const {
    semesters,
    paginationSem: pagination,
    loadingSem: loading,
    filterAcademicYearId: academicYearId,
    activeSem: active,
    selectedSemester
  } = storeToRefs(store)

  async function fetchSemesters(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchSemesters(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchSemesters(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchSemesters(true, page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await store.fetchSemesters(true, 1)
  }

  async function resetFilter() {
    academicYearId.value = 'ALL'
    active.value = 'ALL'
    await store.fetchSemesters(true, 1)
  }

  return {
    semesters,
    pagination,
    loading,
    academicYearId,
    active,
    selectedSemester,
    fetchSemesters,
    refresh,
    changePage,
    changeLimit,
    resetFilter
  }
}
