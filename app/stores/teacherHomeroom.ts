import { defineStore } from 'pinia'
import { useGradesStore } from './grades'

export interface HomeroomSemesterOption {
  label: string
  value: string
}

export const useTeacherHomeroomStore = defineStore('teacherHomeroom', () => {
  const homeroom = ref<any | null>(null)
  const classroomId = computed(() => homeroom.value?.classroomId || '')

  const selectedSemesterId = ref<string>('ACTIVE')
  const semesters = ref<any[]>([])
  const isLoadedSemesters = ref(false)

  const selectedTeachingId = ref('ALL')
  const teachings = ref<any[]>([])
  const inspectionData = ref<any | null>(null)

  const isLoaded = ref(false)
  const pendingHomeroom = ref(false)
  const pendingGrades = ref(false)

  const students = computed<any[]>(() => inspectionData.value?.students || [])

  const semesterOptions = computed<HomeroomSemesterOption[]>(() => {
    return [
      { label: 'Semester Aktif (Sistem)', value: 'ACTIVE' },
      ...semesters.value.map((s: any) => ({
        label: `${s.type === 'GENAP' ? 'Genap' : 'Ganjil'} ${s.academicYear?.name || ''}${s.isActive ? ' (Aktif)' : ''}`,
        value: s.id
      }))
    ]
  })

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

  let homeroomPromise: Promise<void> | null = null
  let gradesPromise: Promise<void> | null = null

  async function fetchSemesters(force = false) {
    if (isLoadedSemesters.value && !force && semesters.value.length > 0) return
    try {
      const res = await $fetch<{ data?: any[] }>('/api/semesters?limit=100', { credentials: 'include' })
      if (res?.data) {
        semesters.value = res.data
        isLoadedSemesters.value = true
      }
    } catch (err) {
      console.error('[TeacherHomeroomStore] Gagal mengambil daftar semester:', err)
    }
  }

  async function fetchHomeroom(force = false) {
    if (isLoaded.value && !force) return
    if (homeroomPromise) return homeroomPromise

    if (!homeroom.value) {
      pendingHomeroom.value = true
    }

    homeroomPromise = (async () => {
      try {
        const query: Record<string, string> = {}
        if (selectedSemesterId.value && selectedSemesterId.value !== 'ACTIVE') {
          query.semesterId = selectedSemesterId.value
        }

        const res: any = await $fetch('/api/homerooms/my', {
          query,
          credentials: 'include'
        })
        homeroom.value = res?.data || null

        if (!homeroom.value) {
          teachings.value = []
          inspectionData.value = null
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
        teachings.value = []
        inspectionData.value = null
        pendingGrades.value = false
      } finally {
        pendingHomeroom.value = false
        homeroomPromise = null
      }
    })()

    return homeroomPromise
  }

  async function fetchTeachings(force = false) {
    if (!classroomId.value) return
    if (teachings.value.length && !force) return

    try {
      const query: Record<string, any> = {
        classroomId: classroomId.value,
        limit: 100
      }
      if (selectedSemesterId.value && selectedSemesterId.value !== 'ACTIVE') {
        query.semesterId = selectedSemesterId.value
      } else {
        query.activeSemester = 'true'
      }

      const res: any = await $fetch('/api/teaching-assignments', {
        query,
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

    if (gradesPromise) return gradesPromise

    if (!inspectionData.value) {
      pendingGrades.value = true
    }

    gradesPromise = (async () => {
      try {
        const gradesStore = useGradesStore()
        const tid = (selectedTeachingId.value && selectedTeachingId.value !== 'ALL') ? selectedTeachingId.value : 'ALL'
        const res: any = await gradesStore.fetchInspection(
          classroomId.value,
          tid,
          '',
          force,
          selectedSemesterId.value
        )
        inspectionData.value = res || null
      } catch (err) {
        console.error('[TeacherHomeroomStore] Gagal mengambil grades inspection:', err)
      } finally {
        pendingGrades.value = false
        gradesPromise = null
      }
    })()

    return gradesPromise
  }

  async function refreshAll() {
    await Promise.all([
      fetchSemesters(true),
      fetchHomeroom(true)
    ])
  }

  return {
    homeroom,
    classroomId,
    selectedSemesterId,
    semesters,
    semesterOptions,
    selectedTeachingId,
    teachings,
    inspectionData,
    students,
    subjectOptions,
    isLoaded,
    pendingHomeroom,
    pendingGrades,
    fetchSemesters,
    fetchHomeroom,
    fetchTeachings,
    refreshGrades,
    refreshAll
  }
})
