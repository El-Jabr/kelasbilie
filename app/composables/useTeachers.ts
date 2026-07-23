/* eslint-disable @stylistic/max-statements-per-line */
import type { TeacherTableSchema } from '~~/shared/schemas/teacher'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useTeachers() {
  const teachers = useState<TeacherTableSchema[]>('teachers:list', () => [])
  const pagination = useState<PaginationMeta>('teachers:pagination', () => ({ page: 1, limit: 10, total: 0, pages: 1 }))
  const loading = useState('teachers:loading', () => false)
  const search = useState('teachers:search', () => '')
  const selectedTeacher = useState<TeacherTableSchema | null>('teachers:selected', () => null)

  async function fetchTeachers(page = pagination.value.page) {
    loading.value = true
    try {
      const response = await $fetch<PaginatedResponse<TeacherTableSchema>>('/api/teachers', {
        query: { page, limit: pagination.value.limit, search: search.value || undefined }
      })
      teachers.value = response.data
      pagination.value = response.pagination
    } finally { loading.value = false }
  }

  async function refresh() { pagination.value.page = 1; await fetchTeachers(1) }
  async function changePage(page: number) { await fetchTeachers(page) }
  async function resetFilter() { search.value = ''; await refresh() }

  return { teachers, pagination, loading, search, selectedTeacher, fetchTeachers, refresh, changePage, resetFilter }
}
