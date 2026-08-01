import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const query = getQuery(event)
  const classroomId = String(query.classroomId || '').trim()
  const teachingId = String(query.teachingId || '').trim()
  const search = String(query.search || '').trim()

  if (!classroomId || classroomId === 'ALL') {
    return {
      mode: 'NONE',
      message: 'Silakan pilih kelas terlebih dahulu untuk melihat tabel nilai.'
    }
  }

  // Active semester
  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  })
  if (!activeSemester) {
    throw createError({ statusCode: 404, statusMessage: 'Semester aktif tidak ditemukan.' })
  }

  // 1. Fetch Students in Classroom
  const studentClasses = await prisma.studentClass.findMany({
    where: {
      classroomId,
      semesterId: activeSemester.id,
      ...(search && {
        student: {
          OR: [
            { nis: { contains: search, mode: 'insensitive' } },
            { user: { fullname: { contains: search, mode: 'insensitive' } } }
          ]
        }
      })
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

  // 2. Fetch Teaching Assignments for Classroom
  const teachings = await prisma.teachingAssignment.findMany({
    where: { classroomId, semesterId: activeSemester.id },
    include: {
      subject: true,
      teacher: { include: { user: true } },
      course: {
        include: {
          gradeItems: true
        }
      }
    }
  })

  // Case A: Specific Subject/Teaching Assignment Selected
  if (teachingId && teachingId !== 'ALL') {
    const selectedTeaching = teachings.find(t => t.id === teachingId)
    if (!selectedTeaching) {
      throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan.' })
    }

    // Ambil langsung dari prisma.gradeItem untuk memastikan semua item (termasuk yang baru di-sync) terbawa
    const allItems = await prisma.gradeItem.findMany({
      where: { courseId: selectedTeaching.courseId },
      orderBy: { id: 'asc' }
    })

    const phGradeItems = allItems.filter(g => g.category === 'PH')
    const stsGradeItems = allItems.filter(g => g.category === 'STS')
    const sasGradeItems = allItems.filter(g => g.category === 'SAS')
    const uncategorizedItems = allItems.filter(g => !g.category)

    // Kolom item detail hanya menampilkan selain STS dan SAS (misal PH, Tugas, Kuis)
    const detailGradeItems = allItems.filter(g => g.category !== 'STS' && g.category !== 'SAS')

    const itemIds = allItems.map(g => g.id)
    const studentIds = studentClasses.map(sc => sc.studentId)

    // Fetch Grade Components
    const components = await prisma.gradeComponent.findMany({
      where: {
        studentId: { in: studentIds },
        gradeItemId: { in: itemIds }
      }
    })

    // Fetch Grade Summaries
    const summaries = await prisma.gradeSummary.findMany({
      where: {
        teachingId,
        studentId: { in: studentIds },
        semesterId: activeSemester.id
      }
    })

    const studentsResult = studentClasses.map(sc => {
      const studentId = sc.studentId

      const itemScores: Record<number, number | null> = {}
      const phScores: Record<number, number> = {}
      const phValues: number[] = []

      // Map itemDetails
      const itemDetails: Record<number, { score: number | null, moodleScore: number | null, isManual: boolean }> = {}

      for (const gi of allItems) {
        const comp = components.find(c => c.studentId === studentId && c.gradeItemId === gi.id)
        if (comp) {
          const roundedScore = comp.score !== null ? Math.round(comp.score) : null
          itemScores[gi.id] = roundedScore
          itemDetails[gi.id] = {
            score: roundedScore,
            moodleScore: comp.moodleScore !== null && comp.moodleScore !== undefined ? Math.round(comp.moodleScore) : null,
            isManual: comp.isManual
          }
          if (gi.category === 'PH' && roundedScore !== null) {
            phScores[gi.id] = roundedScore
            phValues.push(roundedScore)
          }
        } else {
          itemScores[gi.id] = null
        }
      }

      // Calculate Average PH
      let averagePh: number | null = null
      if (phValues.length > 0) {
        const sum = phValues.reduce((a, b) => a + b, 0)
        averagePh = Math.round(sum / phValues.length)
      } else {
        const summaryPh = summaries.find(s => s.studentId === studentId && s.category === 'PH')?.score
        if (summaryPh !== undefined && summaryPh !== null) {
          averagePh = Math.round(summaryPh)
        }
      }

      // STS Score
      let stsScore: number | null = null
      const stsComp = components.find(c => c.studentId === studentId && stsGradeItems.some(s => s.id === c.gradeItemId))
      if (stsComp !== undefined && stsComp.score !== null) {
        stsScore = Math.round(stsComp.score)
      } else {
        const summarySts = summaries.find(s => s.studentId === studentId && s.category === 'STS')?.score
        if (summarySts !== undefined && summarySts !== null) {
          stsScore = Math.round(summarySts)
        }
      }

      // SAS Score
      let sasScore: number | null = null
      const sasComp = components.find(c => c.studentId === studentId && sasGradeItems.some(s => s.id === c.gradeItemId))
      if (sasComp !== undefined && sasComp.score !== null) {
        sasScore = Math.round(sasComp.score)
      } else {
        const summarySas = summaries.find(s => s.studentId === studentId && s.category === 'SAS')?.score
        if (summarySas !== undefined && summarySas !== null) {
          sasScore = Math.round(summarySas)
        }
      }

      // Formula 50% Average PH + 25% STS + 25% SAS
      let finalGrade: number | null = null
      if (averagePh !== null || stsScore !== null || sasScore !== null) {
        const p = averagePh ?? 0
        const st = stsScore ?? p
        const sa = sasScore ?? p
        finalGrade = Math.round((p * 0.50) + (st * 0.25) + (sa * 0.25))
      }

      return {
        studentId: sc.student.id,
        nis: sc.student.nis,
        fullname: sc.student.user?.fullname || '-',
        itemScores,
        phScores,
        itemDetails,
        averagePh,
        stsScore,
        sasScore,
        finalGrade
      }
    })

    return {
      mode: 'SUBJECT_DETAIL',
      semester: activeSemester,
      teaching: selectedTeaching,
      allItems,
      detailGradeItems,
      phGradeItems,
      stsGradeItems,
      sasGradeItems,
      uncategorizedItems,
      students: studentsResult
    }
  }

  // Case B: All Subjects in Classroom (Rekap Per Kelas)
  const teachingIds = teachings.map(t => t.id)
  const studentIds = studentClasses.map(sc => sc.studentId)

  const summaries = await prisma.gradeSummary.findMany({
    where: {
      teachingId: { in: teachingIds },
      studentId: { in: studentIds },
      semesterId: activeSemester.id
    }
  })

  const studentsResult = studentClasses.map(sc => {
    const subjectGrades: Record<string, { ph: number | null, sts: number | null, sas: number | null, final: number | null }> = {}

    for (const t of teachings) {
      const rawPh = summaries.find(s => s.studentId === sc.studentId && s.teachingId === t.id && s.category === 'PH')?.score ?? null
      const rawSts = summaries.find(s => s.studentId === sc.studentId && s.teachingId === t.id && s.category === 'STS')?.score ?? null
      const rawSas = summaries.find(s => s.studentId === sc.studentId && s.category === 'SAS')?.score ?? null

      const ph = rawPh !== null ? Math.round(rawPh) : null
      const sts = rawSts !== null ? Math.round(rawSts) : null
      const sas = rawSas !== null ? Math.round(rawSas) : null

      let final: number | null = null
      if (ph !== null || sts !== null || sas !== null) {
        const p = ph ?? 0
        const st = sts ?? p
        const sa = sas ?? p
        final = Math.round((p * 0.50) + (st * 0.25) + (sa * 0.25))
      }

      subjectGrades[t.id] = { ph, sts, sas, final }
    }

    return {
      studentId: sc.student.id,
      nis: sc.student.nis,
      fullname: sc.student.user?.fullname || '-',
      subjectGrades
    }
  })

  return {
    mode: 'CLASSROOM_OVERVIEW',
    semester: activeSemester,
    teachings: teachings.map(t => ({
      id: t.id,
      subjectCode: t.subject.code,
      subjectName: t.subject.name,
      teacherName: t.teacher?.user?.fullname || '-'
    })),
    students: studentsResult
  }
})
