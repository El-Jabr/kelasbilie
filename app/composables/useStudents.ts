import { storeToRefs } from 'pinia'
import { useUserMasterStore } from '~~/app/stores/userMaster'

export function useStudents() {
  const store = useUserMasterStore()
  const {
    students,
    paginationStudents: pagination,
    loadingStudents: loading,
    searchStudents: search,
    selectedStudent
  } = storeToRefs(store)

  async function fetchStudents(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchStudents(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchStudents(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchStudents(true, page)
  }

  async function resetFilter() {
    search.value = ''
    await refresh()
  }

  return {
    students,
    pagination,
    loading,
    search,
    selectedStudent,
    fetchStudents,
    refresh,
    changePage,
    resetFilter
  }
}
