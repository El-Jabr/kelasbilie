import { storeToRefs } from 'pinia'
import { useAssignmentStore } from '~~/app/stores/assignment'

export function useHomerooms() {
  const store = useAssignmentStore()
  const {
    homerooms,
    homeroomPagination: pagination,
    loadingHR: loading,
    selectedHomeroom
  } = storeToRefs(store)

  const search = useState('homerooms:search', () => '')
  const filterSemesterId = useState('homerooms:filterSemesterId', () => '')
  const filterClassroomId = useState('homerooms:filterClassroomId', () => '')
  const filterTeacherId = useState('homerooms:filterTeacherId', () => '')

  async function fetchHomerooms(page = pagination.value.page, force = false) {
    await store.fetchHomerooms(force, {
      semesterId: filterSemesterId.value,
      classroomId: filterClassroomId.value,
      teacherId: filterTeacherId.value
    })
  }

  async function refresh() {
    await fetchHomerooms(1, true)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await fetchHomerooms(page, true)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchHomerooms(1, true)
  }

  async function resetFilter() {
    search.value = ''
    filterSemesterId.value = ''
    filterClassroomId.value = ''
    filterTeacherId.value = ''
    await fetchHomerooms(1, true)
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
