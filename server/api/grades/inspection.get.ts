import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const query = getQuery(event)
  const classroomId = String(query.classroomId || '').trim()
  const teachingId = String(query.teachingId || '').trim()
  const search = String(query.search || '').trim()
  const requestedSemesterId = String(query.semesterId || '').trim()

  if (!classroomId || classroomId === 'ALL') {
    return {
      mode: 'NONE',
      message: 'Silakan pilih kelas terlebih dahulu untuk melihat tabel nilai.'
    }
  }

  // 1. Fetch requested semester or fallback to activeSemester
  let activeSemester = null
  if (requestedSemesterId && requestedSemesterId !== 'ALL' && requestedSemesterId !== 'ACTIVE') {
    activeSemester = await prisma.semester.findUnique({
      where: { id: requestedSemesterId },
      include: { academicYear: true }
    })
  }

  if (!activeSemester) {
    activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
      include: { academicYear: true }
    })
  }

  if (!activeSemester) {
    throw createError({ statusCode: 404, statusMessage: 'Semester tidak ditemukan.' })
  }

  const [studentClasses, teachings] = await Promise.all([
    prisma.studentClass.findMany({
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
    }),
    prisma.teachingAssignment.findMany({
      where: { classroomId, semesterId: activeSemester.id },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        classroom: true
      }
    })
  ])

  // Case A: Specific Subject/Teaching Assignment Selected
  if (teachingId && teachingId !== 'ALL') {
    const selectedTeaching = teachings.find(t => t.id === teachingId)
    if (!selectedTeaching) {
      throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan.' })
    }

    const studentIds = studentClasses.map(sc => sc.studentId)

    // Parallelize grade items and summaries (guard courseId if null)
    const [allItems, summaries] = await Promise.all([
      selectedTeaching.courseId
        ? prisma.gradeItem.findMany({
            where: { courseId: selectedTeaching.courseId },
            orderBy: { id: 'asc' }
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? prisma.gradeSummary.findMany({
            where: {
              teachingId,
              studentId: { in: studentIds },
              semesterId: activeSemester.id
            }
          })
        : Promise.resolve([])
    ])

    const itemIds = allItems.map(g => g.id)
    const components = (studentIds.length > 0 && itemIds.length > 0)
      ? await prisma.gradeComponent.findMany({
          where: {
            studentId: { in: studentIds },
            gradeItemId: { in: itemIds }
          }
        })
      : []

    const phGradeItems = allItems.filter(g => g.category === 'PH')
    const stsGradeItems = allItems.filter(g => g.category === 'STS')
    const sasGradeItems = allItems.filter(g => g.category === 'SAS')
    const uncategorizedItems = allItems.filter(g => !g.category)
    const detailGradeItems = allItems.filter(g => g.category !== 'STS' && g.category !== 'SAS')

    // Create fast lookup maps O(1)
    const componentMap = new Map<string, typeof components[0]>()
    for (const c of components) {
      componentMap.set(`${c.studentId}_${c.gradeItemId}`, c)
    }

    const summaryMap = new Map<string, number>()
    for (const s of summaries) {
      summaryMap.set(`${s.studentId}_${s.category}`, s.score)
    }

    const stsItemIds = new Set(stsGradeItems.map(s => s.id))
    const sasItemIds = new Set(sasGradeItems.map(s => s.id))

    const studentsResult = studentClasses.map((sc) => {
      const studentId = sc.studentId

      const itemScores: Record<number, number | null> = {}
      const phScores: Record<number, number> = {}
      const phValues: number[] = []
      const itemDetails: Record<number, { score: number | null, moodleScore: number | null, isManual: boolean }> = {}

      for (const gi of allItems) {
        const comp = componentMap.get(`${studentId}_${gi.id}`)
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
        const summaryPh = summaryMap.get(`${studentId}_PH`)
        if (summaryPh !== undefined && summaryPh !== null) {
          averagePh = Math.round(summaryPh)
        }
      }

      // STS Score
      let stsScore: number | null = null
      let stsCompScore: number | null = null
      for (const sId of stsItemIds) {
        const comp = componentMap.get(`${studentId}_${sId}`)
        if (comp && comp.score !== null) {
          stsCompScore = comp.score
          break
        }
      }
      if (stsCompScore !== null) {
        stsScore = Math.round(stsCompScore)
      } else {
        const summarySts = summaryMap.get(`${studentId}_STS`)
        if (summarySts !== undefined && summarySts !== null) {
          stsScore = Math.round(summarySts)
        }
      }

      // SAS Score
      let sasScore: number | null = null
      let sasCompScore: number | null = null
      for (const saId of sasItemIds) {
        const comp = componentMap.get(`${studentId}_${saId}`)
        if (comp && comp.score !== null) {
          sasCompScore = comp.score
          break
        }
      }
      if (sasCompScore !== null) {
        sasScore = Math.round(sasCompScore)
      } else {
        const summarySas = summaryMap.get(`${studentId}_SAS`)
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

  const summaries = (teachingIds.length > 0 && studentIds.length > 0)
    ? await prisma.gradeSummary.findMany({
        where: {
          teachingId: { in: teachingIds },
          studentId: { in: studentIds },
          semesterId: activeSemester.id
        },
        select: {
          studentId: true,
          teachingId: true,
          category: true,
          score: true
        }
      })
    : []

  // Fast map lookup O(1)
  const summaryLookup = new Map<string, number>()
  for (const s of summaries) {
    summaryLookup.set(`${s.studentId}_${s.teachingId}_${s.category}`, s.score)
  }

  const studentsResult = studentClasses.map((sc) => {
    const subjectGrades: Record<string, { ph: number | null, sts: number | null, sas: number | null, final: number | null }> = {}

    for (const t of teachings) {
      const rawPh = summaryLookup.get(`${sc.studentId}_${t.id}_PH`) ?? null
      const rawSts = summaryLookup.get(`${sc.studentId}_${t.id}_STS`) ?? null
      const rawSas = summaryLookup.get(`${sc.studentId}_${t.id}_SAS`) ?? null

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
      courseId: t.courseId,
      subjectCode: t.subject.code,
      subjectName: t.subject.name,
      teacherName: t.teacher?.user?.fullname || '-'
    })),
    students: studentsResult
  }
})
