
export interface UserItem {
  id: string
  username: string
  fullname: string
  email: string | null
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  moodleUserId: number | null
  isActive: boolean
  createdAt: string
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

interface UserResponse {
  data: UserItem[]
  pagination: PaginationMeta
}

export function useUsers() {
  // State
  const users = useState<UserItem[]>('users:list', () => [])
  const pagination = useState<PaginationMeta>('users:pagination', () => ({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  }))

  const loading = useState('users:loading', () => false)

  // Filter
  const search = useState('users:search', () => '')
  const role = useState<string>('users:role', () => '')
  const active = useState<string>('users:active', () => '')

  // Sorting
  const sort = useState('users:sort', () => 'createdAt')
  const order = useState<'asc' | 'desc'>('users:order', () => 'desc')

  // Selected rows (untuk fitur berikutnya)
  const selected = useState<UserItem[]>('users:selected', () => [])

  const selectedUser = useState<UserItem | null>(
  'users:selected-user',
  () => null
  )

  const roleDialogOpen = useState(
  'users:role-dialog',
  () => false
  )

  async function fetchUsers(page = pagination.value.page) {
    loading.value = true

    try {
      const response = await $fetch<UserResponse>('/api/users', {
        query: {
          page,
          limit: pagination.value.limit,
          search: search.value || undefined,
          role: role.value || undefined,
          active: active.value || undefined,
          sort: sort.value,
          order: order.value
        }
      })

      users.value = response.data
      pagination.value = response.pagination
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
  pagination.value.page = 1
  await fetchUsers(1)
  }

  async function changePage(page: number) {
    await fetchUsers(page)
  }

  async function changeLimit(limit: number) {
    pagination.value.limit = limit
    await fetchUsers(1)
  }

  async function changeSort(field: string) {
    if (sort.value === field) {
      order.value = order.value === 'asc' ? 'desc' : 'asc'
    } else {
      sort.value = field
      order.value = 'asc'
    }

    await fetchUsers(1)
  }

  async function resetFilter() {
  search.value = ''
  role.value = ''
  active.value = ''
  sort.value = 'createdAt'
  order.value = 'desc'

  await fetchUsers(1)
  }

  function openRoleDialog(user: UserItem) {
    selectedUser.value = user
    roleDialogOpen.value = true
    }

    function closeRoleDialog() {
      roleDialogOpen.value = false
      selectedUser.value = null
    }

    async function updateRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT') {
    if (!selectedUser.value) {
      return
    }

    loading.value = true

    try {
      await $fetch(`/api/users/${selectedUser.value.id}/role`, {
        method: 'PATCH',
        body: {
          role
        }
      })

      const user = users.value.find(
        u => u.id === selectedUser.value?.id
      )

      if (user) {
        user.role = role
      }

      closeRoleDialog()

      useToast().add({
        title: 'Berhasil',
        description: 'Role user berhasil diperbarui.',
        color: 'success'
      })
    }
    finally {
      loading.value = false
    }
  }

  return {
    // data
    users,
    pagination,
    loading,

    // filter
    search,
    role,
    active,

    // sorting
    sort,
    order,

    // selection
    selected,
    selectedUser,
    roleDialogOpen,
  
    // methods
    fetchUsers,
    refresh,
    changePage,
    changeLimit,
    changeSort,
    resetFilter,
    openRoleDialog,
    closeRoleDialog,
    updateRole
  }
}
