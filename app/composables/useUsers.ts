import { storeToRefs } from 'pinia'
import { useUserMasterStore } from '~~/app/stores/userMaster'

export function useUsers() {
  const store = useUserMasterStore()
  const {
    users,
    paginationUsers: pagination,
    loadingUsers: loading,
    searchUsers: search,
    roleUsers: role,
    activeUsers: active,
    sortUsers: sort,
    orderUsers: order,
    selectedUsers: selected,
    selectedUser
  } = storeToRefs(store)

  async function fetchUsers(force?: boolean | unknown) {
    const isForce = force === true
    await store.fetchUsers(isForce)
  }

  async function refresh() {
    pagination.value.page = 1
    await store.fetchUsers(true, 1)
  }

  async function changePage(page: number) {
    pagination.value.page = page
    await store.fetchUsers(true, page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await store.fetchUsers(true, 1)
  }

  async function resetFilter() {
    search.value = ''
    role.value = 'ALL'
    active.value = 'ALL'
    sort.value = 'createdAt'
    order.value = 'desc'
    await store.fetchUsers(true, 1)
  }

  return {
    users,
    pagination,
    loading,
    search,
    role,
    active,
    sort,
    order,
    selected,
    selectedUser,
    fetchUsers,
    refresh,
    changePage,
    changeLimit,
    resetFilter
  }
}
