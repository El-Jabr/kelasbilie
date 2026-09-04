import { storeToRefs } from 'pinia'
import { useUserMasterStore } from '~~/app/stores/userMaster'

export function useTeachers() {
  const store = useUserMasterStore()
  const {
    teachers,
    paginationTeachers: pagination,
    loadingTeachers: loading,
    searchTeachers: search,
    selectedTeacher
  } = storeToRefs(store)

  async function fetchTeachers(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchTeachers(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchTeachers(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchTeachers(true, page)
  }

  async function resetFilter() {
    search.value = ''
    await refresh()
  }

  return {
    teachers,
    pagination,
    loading,
    search,
    selectedTeacher,
    fetchTeachers,
    refresh,
    changePage,
    resetFilter
  }
}
