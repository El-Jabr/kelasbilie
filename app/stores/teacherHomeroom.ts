import { defineStore } from 'pinia'
import { useGradesStore } from './grades'

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

  let homeroomPromise: Promise<void> | null = null
  let gradesPromise: Promise<void> | null = null

  async function fetchHomeroom(force = false) {
    if (isLoaded.value && !force) return
    if (homeroomPromise) return homeroomPromise

    if (!homeroom.value) {
      pendingHomeroom.value = true
    }

    homeroomPromise = (async () => {
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
        homeroomPromise = null
      }
    })()

    return homeroomPromise
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
          force
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
