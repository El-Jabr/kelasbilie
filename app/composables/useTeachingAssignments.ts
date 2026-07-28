import type { TeachingAssignmentSchema } from '~~/shared/schemas/teaching-assignment'

export function useTeachingAssignments() {
  const teachingAssignments = useState<any[]>(
    'teaching-assignments:list',
    () => []
  )

  const teachers = useState<any[]>(
    'teaching-assignments:teachers',
    () => []
  )

  const subjects = useState<any[]>(
    'teaching-assignments:subjects',
    () => []
  )

  const classes = useState<any[]>(
    'teaching-assignments:classes',
    () => []
  )

  const semesters = useState<any[]>(
    'teaching-assignments:semesters',
    () => []
  )

  const courses = useState<any[]>(
    'teaching-assignments:courses',
    () => []
  )

  const loading = useState(
    'teaching-assignments:loading',
    () => false
  )

  const selectedAssignment = useState<any | null>(
    'teaching-assignments:selected',
    () => null
  )

  async function fetchTeachingAssignments() {
    loading.value = true
    try {
      const [asRes, tRes, sRes, cRes, semRes, coRes]: any = await Promise.all([
        $fetch('/api/teaching-assignments', { credentials: 'include' }),
        $fetch('/api/teachers', { credentials: 'include' }),
        $fetch('/api/subjects', { credentials: 'include' }),
        $fetch('/api/classes', { credentials: 'include' }),
        $fetch('/api/semesters', { credentials: 'include' }),
        $fetch('/api/moodle', { credentials: 'include' })
      ])

      if (asRes?.data) teachingAssignments.value = asRes.data
      if (tRes?.data) teachers.value = tRes.data
      if (sRes?.data) subjects.value = sRes.data
      if (cRes?.data) classes.value = cRes.data
      if (semRes?.data) semesters.value = semRes.data
      if (coRes?.data) courses.value = coRes.data
    } catch (err) {
      console.error('Gagal mengambil data penugasan mengajar:', err)
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchTeachingAssignments()
  }

  // Options for select inputs
  const teacherOptions = computed(() => teachers.value.map((t: any) => ({
    value: t.id,
    label: `${t.user?.fullname || 'Guru'} (NIP: ${t.nip || '-'})`
  })))

  const subjectOptions = computed(() => subjects.value.map((s: any) => ({
    value: s.id,
    label: `${s.name} (${s.code})`
  })))

  const classOptions = computed(() => classes.value.map((c: any) => ({
    value: c.id,
    label: `${c.name} (Level ${c.level})`
  })))

  const semesterOptions = computed(() => semesters.value.map((sem: any) => ({
    value: sem.id,
    label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
  })))

  const courseOptions = computed(() => courses.value.map((co: any) => ({
    value: co.id,
    label: `${co.fullname} (ID: ${co.id})`
  })))

  return {
    teachingAssignments,
    teachers,
    subjects,
    classes,
    semesters,
    courses,
    loading,
    selectedAssignment,
    teacherOptions,
    subjectOptions,
    classOptions,
    semesterOptions,
    courseOptions,
    fetchTeachingAssignments,
    refresh
  }
}
