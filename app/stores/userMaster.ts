import { defineStore } from 'pinia'
import type { TeacherTableSchema } from '~~/shared/schemas/teacher'
import type { StudentTableSchema } from '~~/shared/schemas/student'
import type { UserSchema } from '~~/shared/schemas/user'
import type { PaginatedResponse, PaginationMeta } from '~~/shared/types/api'

export const useUserMasterStore = defineStore('userMaster', () => {
  // ── 1. TEACHERS MASTER ──────────────────────────────────────────────────
  const teachers = ref<TeacherTableSchema[]>([])
  const paginationTeachers = ref<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 })
  const loadingTeachers = ref(false)
  const isLoadedTeachers = ref(false)
  const searchTeachers = ref('')
  const selectedTeacher = ref<TeacherTableSchema | null>(null)

  // In-flight promise tracking for deduplication
  let teachersPromise: Promise<void> | null = null
  let studentsPromise: Promise<void> | null = null
  let usersPromise: Promise<void> | null = null

  async function fetchTeachers(force = false, page = paginationTeachers.value.page) {
    if (isLoadedTeachers.value && !force) return
    if (teachersPromise) return teachersPromise

    if (teachers.value.length === 0) {
      loadingTeachers.value = true
    }

    teachersPromise = (async () => {
      try {
        const response = await $fetch<PaginatedResponse<TeacherTableSchema>>('/api/teachers', {
          credentials: 'include',
          query: {
            page,
            limit: paginationTeachers.value.limit,
            search: searchTeachers.value || undefined
          }
        })

        teachers.value = response.data
        paginationTeachers.value = response.pagination
        isLoadedTeachers.value = true
      } catch (err) {
        console.error('[UserMasterStore] Gagal mengambil data guru:', err)
      } finally {
        loadingTeachers.value = false
        teachersPromise = null
      }
    })()

    return teachersPromise
  }

  // ── 2. STUDENTS MASTER ──────────────────────────────────────────────────
  const students = ref<StudentTableSchema[]>([])
  const paginationStudents = ref<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 })
  const loadingStudents = ref(false)
  const isLoadedStudents = ref(false)
  const searchStudents = ref('')
  const selectedStudent = ref<StudentTableSchema | null>(null)

  async function fetchStudents(force = false, page = paginationStudents.value.page) {
    if (isLoadedStudents.value && !force) return
    if (studentsPromise) return studentsPromise

    if (students.value.length === 0) {
      loadingStudents.value = true
    }

    studentsPromise = (async () => {
      try {
        const response = await $fetch<PaginatedResponse<StudentTableSchema>>('/api/students', {
          credentials: 'include',
          query: {
            page,
            limit: paginationStudents.value.limit,
            search: searchStudents.value || undefined
          }
        })

        students.value = response.data
        paginationStudents.value = response.pagination
        isLoadedStudents.value = true
      } catch (err) {
        console.error('[UserMasterStore] Gagal mengambil data siswa:', err)
      } finally {
        loadingStudents.value = false
        studentsPromise = null
      }
    })()

    return studentsPromise
  }

  // ── 3. USERS / ACCOUNTS MASTER ──────────────────────────────────────────
  const users = ref<UserSchema[]>([])
  const paginationUsers = ref<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 1 })
  const loadingUsers = ref(false)
  const isLoadedUsers = ref(false)
  const searchUsers = ref('')
  const roleUsers = ref<string>('ALL')
  const activeUsers = ref<string>('ALL')
  const sortUsers = ref('createdAt')
  const orderUsers = ref<'asc' | 'desc'>('desc')
  const selectedUsers = ref<UserSchema[]>([])
  const selectedUser = ref<UserSchema | null>(null)

  async function fetchUsers(force = false, page = paginationUsers.value.page) {
    if (isLoadedUsers.value && !force) return
    if (usersPromise) return usersPromise

    if (users.value.length === 0) {
      loadingUsers.value = true
    }

    usersPromise = (async () => {
      try {
        const response = await $fetch<PaginatedResponse<UserSchema>>('/api/users', {
          credentials: 'include',
          query: {
            page,
            limit: paginationUsers.value.limit,
            search: searchUsers.value || undefined,
            role: roleUsers.value === 'ALL' ? undefined : roleUsers.value,
            active: activeUsers.value === 'ALL' ? undefined : activeUsers.value,
            sort: sortUsers.value,
            order: orderUsers.value
          }
        })

        users.value = response.data
        paginationUsers.value = response.pagination
        isLoadedUsers.value = true
      } catch (err) {
        console.error('[UserMasterStore] Gagal mengambil data user:', err)
      } finally {
        loadingUsers.value = false
        usersPromise = null
      }
    })()

    return usersPromise
  }

  return {
    // Teachers
    teachers,
    paginationTeachers,
    loadingTeachers,
    isLoadedTeachers,
    searchTeachers,
    selectedTeacher,
    fetchTeachers,

    // Students
    students,
    paginationStudents,
    loadingStudents,
    isLoadedStudents,
    searchStudents,
    selectedStudent,
    fetchStudents,

    // Users
    users,
    paginationUsers,
    loadingUsers,
    isLoadedUsers,
    searchUsers,
    roleUsers,
    activeUsers,
    sortUsers,
    orderUsers,
    selectedUsers,
    selectedUser,
    fetchUsers
  }
})
