/* eslint-disable @stylistic/max-statements-per-line */
import type { StudentTableSchema } from '~~/shared/schemas/student'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export function useStudents() {
  const students = useState<StudentTableSchema[]>('students:list', () => [])
  const pagination = useState<PaginationMeta>('students:pagination', () => ({ page: 1, limit: 10, total: 0, pages: 1 }))
  const loading = useState('students:loading', () => false)
  const search = useState('students:search', () => '')
  const selectedStudent = useState<StudentTableSchema | null>('students:selected', () => null)

  async function fetchStudents(page = pagination.value.page) {
    loading.value = true
    try {
      const response = await $fetch<PaginatedResponse<StudentTableSchema>>('/api/students', {
        query: { page, limit: pagination.value.limit, search: search.value || undefined }
      })
      students.value = response.data
      pagination.value = response.pagination
    } finally { loading.value = false }
  }

  async function refresh() { pagination.value.page = 1; await fetchStudents(1) }
  async function changePage(page: number) { await fetchStudents(page) }
  async function resetFilter() { search.value = ''; await refresh() }

  return { students, pagination, loading, search, selectedStudent, fetchStudents, refresh, changePage, resetFilter }
}
