import { defineStore } from 'pinia'

export const useTeacherClassStore = defineStore('teacherClass', () => {
  const teacher = ref<any | null>(null)
  const assignments = ref<any[]>([])
  const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
  const search = ref('')
  const page = ref(1)

  const isLoaded = ref(false)
  const pendingTeacher = ref(false)
  const pendingAssignments = ref(false)

  let teacherPromise: Promise<void> | null = null
  let assignmentsPromise: Promise<void> | null = null

  async function fetchTeacher(force = false) {
    if (teacher.value && !force) return
    if (teacherPromise) return teacherPromise

    pendingTeacher.value = true
    teacherPromise = (async () => {
      try {
        const res: any = await $fetch('/api/teachers/me', { credentials: 'include' })
        teacher.value = res?.data || null
      } catch (err) {
        console.error('[TeacherClassStore] Gagal mengambil profil guru:', err)
        teacher.value = null
      } finally {
        pendingTeacher.value = false
        teacherPromise = null
      }
    })()

    return teacherPromise
  }

  async function fetchAssignments(force = false) {
    if (!teacher.value?.id) {
      await fetchTeacher(force)
    }

    if (!teacher.value?.id) {
      assignments.value = []
      return
    }

    if (isLoaded.value && !force) return
    if (assignmentsPromise) return assignmentsPromise

    if (assignments.value.length === 0) {
      pendingAssignments.value = true
    }

    assignmentsPromise = (async () => {
      try {
        const res: any = await $fetch('/api/teaching-assignments', {
          credentials: 'include',
          query: {
            teacherId: teacher.value.id,
            search: search.value || undefined,
            page: page.value,
            limit: pagination.value.limit
          }
        })

        assignments.value = res?.data || []
        if (res?.pagination) {
          pagination.value = res.pagination
        }
        isLoaded.value = true
      } catch (err) {
        console.error('[TeacherClassStore] Gagal mengambil daftar kelas ajar:', err)
      } finally {
        pendingAssignments.value = false
        assignmentsPromise = null
      }
    })()

    return assignmentsPromise
  }

  async function refreshAll() {
    await fetchAssignments(true)
  }

  return {
    teacher,
    assignments,
    pagination,
    search,
    page,
    isLoaded,
    pendingTeacher,
    pendingAssignments,
    fetchTeacher,
    fetchAssignments,
    refreshAll
  }
})
