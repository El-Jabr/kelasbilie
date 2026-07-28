export function useStudentClasses() {
  const page = useState('student-classes:page', () => 1)
  const limit = useState('student-classes:limit', () => 10)
  const searchQuery = useState('student-classes:searchQuery', () => '')
  const searchInput = useState('student-classes:searchInput', () => '')
  const filterSemesterId = useState('student-classes:filterSemesterId', () => 'ALL')
  const filterClassroomId = useState('student-classes:filterClassroomId', () => 'ALL')

  const pendingSC = useState('student-classes:pending', () => true)
  const studentClasses = useState<any[]>('student-classes:list', () => [])
  const pagination = useState('student-classes:pagination', () => ({ page: 1, limit: 10, total: 0, pages: 1 }))

  const students = useState<any[]>('student-classes:students', () => [])
  const classes = useState<any[]>('student-classes:classes', () => [])
  const semesters = useState<any[]>('student-classes:semesters', () => [])

  async function refreshSC() {
    pendingSC.value = true
    try {
      const res: any = await $fetch('/api/student-classes', {
        query: {
          page: page.value,
          limit: limit.value,
          search: searchQuery.value,
          semesterId: filterSemesterId.value === 'ALL' ? undefined : filterSemesterId.value,
          classroomId: filterClassroomId.value === 'ALL' ? undefined : filterClassroomId.value
        },
        credentials: 'include'
      })
      if (res) {
        studentClasses.value = res.data || []
        pagination.value = res.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
      }
    } catch (err) {
      console.error('Gagal mengambil data pembagian kelas:', err)
    } finally {
      pendingSC.value = false
    }
  }

  async function loadSupportingData() {
    try {
      const [stRes, clRes, semRes]: any = await Promise.all([
        $fetch('/api/students?limit=1000', { credentials: 'include' }),
        $fetch('/api/classes', { credentials: 'include' }),
        $fetch('/api/semesters', { credentials: 'include' })
      ])
      if (stRes?.data) students.value = stRes.data
      if (clRes?.data) classes.value = clRes.data
      if (semRes?.data) semesters.value = semRes.data
    } catch (err) {
      console.error('Gagal memuat data pendukung:', err)
    }
  }

  const studentOptions = computed(() => students.value.map((s: any) => ({
    value: s.id,
    label: `${s.user?.fullname || 'Siswa'} (NIS: ${s.nis || '-'})`
  })))

  const classOptions = computed(() => classes.value.map((c: any) => ({
    value: c.id,
    label: `${c.name} (Level ${c.level})`
  })))

  const filterClassOptions = computed(() => [
    { value: 'ALL', label: 'Semua Kelas' },
    ...classOptions.value
  ])

  const semesterOptions = computed(() => semesters.value.map((sem: any) => ({
    value: sem.id,
    label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
  })))

  const filterSemesterOptions = computed(() => [
    { value: 'ALL', label: 'Semua Semester' },
    ...semesterOptions.value
  ])

  function resetFilter() {
    searchInput.value = ''
    searchQuery.value = ''
    filterSemesterId.value = 'ALL'
    filterClassroomId.value = 'ALL'
    page.value = 1
  }

  return {
    page,
    limit,
    searchQuery,
    searchInput,
    filterSemesterId,
    filterClassroomId,
    pendingSC,
    studentClasses,
    pagination,
    students,
    classes,
    semesters,
    studentOptions,
    classOptions,
    filterClassOptions,
    semesterOptions,
    filterSemesterOptions,
    refreshSC,
    loadSupportingData,
    resetFilter
  }
}
