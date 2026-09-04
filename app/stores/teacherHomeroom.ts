import { defineStore } from 'pinia'

export const useTeacherHomeroomStore = defineStore('teacherHomeroom', () => {
  const homeroom = ref<any | null>(null)
  const classroomId = computed(() => homeroom.value?.classroomId || '')

  const selectedTeachingId = ref('ALL')
  const teachings = ref<any[]>([])
  const inspectionData = ref<any | null>(null)

  const isLoaded = ref(false)
  const pendingHomeroom = ref(false)
  const pendingGrades = ref(false)

  const students = computed<any[]>(() => inspectionData.value?.students || [])

  const subjectOptions = computed(() => {
    const options = [
      { label: 'Semua Mata Pelajaran (Rekap Kelas)', value: 'ALL' }
    ]
    const list = teachings.value.length ? teachings.value : (inspectionData.value?.teachings || [])
    for (const t of list) {
      const sName = t.subject?.name || t.subjectName || 'Mata Pelajaran'
      const sCode = (t.subject?.code || t.subjectCode) ? ` (${t.subject?.code || t.subjectCode})` : ''
      const tName = (t.teacher?.user?.fullname || t.teacherName) ? ` - Guru: ${t.teacher?.user?.fullname || t.teacherName}` : ''
      options.push({
        label: `${sName}${sCode}${tName}`,
        value: t.id
      })
    }
    return options
  })

  async function fetchHomeroom(force = false) {
    if (!isLoaded.value || force) {
      pendingHomeroom.value = true
    }

    try {
      const res: any = await $fetch('/api/homerooms/my', { credentials: 'include' })
      homeroom.value = res?.data || null

      if (!homeroom.value) {
        pendingGrades.value = false
        isLoaded.value = true
        return
      }

      await Promise.all([
        fetchTeachings(force),
        refreshGrades(force)
      ])

      isLoaded.value = true
    } catch (err) {
      console.error('[TeacherHomeroomStore] Gagal mengambil homeroom:', err)
      homeroom.value = null
      pendingGrades.value = false
    } finally {
      pendingHomeroom.value = false
    }
  }

  async function fetchTeachings(force = false) {
    if (!classroomId.value) return
    if (teachings.value.length && !force) return

    try {
      const res: any = await $fetch('/api/teaching-assignments', {
        query: {
          classroomId: classroomId.value,
          limit: 100
        },
        credentials: 'include'
      })
      teachings.value = res?.data || []
    } catch (err) {
      console.error('[TeacherHomeroomStore] Gagal mengambil teachings:', err)
    }
  }

  async function refreshGrades(force = false) {
    if (!classroomId.value) {
      pendingGrades.value = false
      return
    }

    if (!isLoaded.value || force) {
      pendingGrades.value = true
    }

    try {
      const res: any = await $fetch('/api/grades/inspection', {
        query: {
          classroomId: classroomId.value,
          teachingId: (selectedTeachingId.value && selectedTeachingId.value !== 'ALL') ? selectedTeachingId.value : undefined
        },
        credentials: 'include'
      })
      inspectionData.value = res || null
    } catch (err) {
      console.error('[TeacherHomeroomStore] Gagal mengambil grades inspection:', err)
    } finally {
      pendingGrades.value = false
    }
  }

  async function refreshAll() {
    await fetchHomeroom(true)
  }

  return {
    homeroom,
    classroomId,
    selectedTeachingId,
    teachings,
    inspectionData,
    students,
    subjectOptions,
    isLoaded,
    pendingHomeroom,
    pendingGrades,
    fetchHomeroom,
    fetchTeachings,
    refreshGrades,
    refreshAll
  }
})
