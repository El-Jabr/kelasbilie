import { prisma } from '../../../utils/db'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const classroomId = getRouterParam(event, 'classroomId')
  if (!classroomId) {
    throw createError({ statusCode: 400, statusMessage: 'Classroom ID wajib diisi.' })
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId }
  })

  if (!classroom) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan.' })
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  })

  if (!activeSemester) {
    throw createError({ statusCode: 404, statusMessage: 'Tidak ada semester aktif.' })
  }

  // Ambil semua siswa di kelas ini pada semester aktif
  const studentClasses = await prisma.studentClass.findMany({
    where: {
      classroomId,
      semesterId: activeSemester.id
    },
    include: {
      student: {
        include: { user: true }
      }
    },
    orderBy: {
      student: {
        user: { fullname: 'asc' }
      }
    }
  })

  // Ambil semua mata pelajaran yang diajarkan di kelas ini pada semester aktif
  const teachingAssignments = await prisma.teachingAssignment.findMany({
    where: {
      classroomId,
      semesterId: activeSemester.id
    },
    include: {
      subject: true,
      teacher: { include: { user: true } }
    }
  })

  const teachingIds = teachingAssignments.map(t => t.id)
  const studentIds = studentClasses.map(sc => sc.studentId)

  // Ambil semua GradeSummary terkait (teachingId, category, score)
  const summaries = await prisma.gradeSummary.findMany({
    where: {
      teachingId: { in: teachingIds },
      studentId: { in: studentIds },
      semesterId: activeSemester.id
    }
  })

  // Grouping grades by studentId and subjectId
  const studentsWithGrades = studentClasses.map(sc => {
    const studentGrades: Record<string, any> = {}

    for (const ta of teachingAssignments) {
      const phSummary = summaries.find(s => s.studentId === sc.studentId && s.teachingId === ta.id && s.category === 'PH')
      const stsSummary = summaries.find(s => s.studentId === sc.studentId && s.teachingId === ta.id && s.category === 'STS')
      const sasSummary = summaries.find(s => s.studentId === sc.studentId && s.teachingId === ta.id && s.category === 'SAS')

      const phAvg = phSummary ? phSummary.score : null
      const stsScore = stsSummary ? stsSummary.score : null
      const sasScore = sasSummary ? sasSummary.score : null

      // Formula Hitung Nilai Akhir
      let finalGrade: number | null = null
      if (phAvg !== null || stsScore !== null || sasScore !== null) {
        const ph = phAvg ?? 0
        const sts = stsScore ?? ph
        const sas = sasScore ?? ph
        finalGrade = Number((ph * 0.4 + sts * 0.3 + sas * 0.3).toFixed(2))
      }

      let letterGrade: string | null = null
      let isPassed: boolean | null = null
      if (finalGrade !== null) {
        isPassed = finalGrade >= 75
        if (finalGrade >= 90) letterGrade = 'A'
        else if (finalGrade >= 80) letterGrade = 'B'
        else if (finalGrade >= 75) letterGrade = 'C'
        else letterGrade = 'D'
      }

      studentGrades[ta.subjectId] = {
        subjectCode: ta.subject.code,
        subjectName: ta.subject.name,
        teachingId: ta.id,
        phAvg,
        stsScore,
        sasScore,
        finalGrade,
        letterGrade,
        isPassed
      }
    }

    return {
      studentId: sc.student.id,
      nis: sc.student.nis,
      fullname: sc.student.user?.fullname || '-',
      grades: studentGrades
    }
  })

  return {
    data: {
      classroom,
      semester: activeSemester,
      subjects: teachingAssignments.map(ta => ({
        id: ta.subject.id,
        code: ta.subject.code,
        name: ta.subject.name,
        teacherName: ta.teacher?.user?.fullname || '-'
      })),
      students: studentsWithGrades
    }
  }
})
