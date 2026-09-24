import { prisma as db } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/auth'

export interface SubjectScoreItem {
  subjectName: string
  subjectCode: string
  finalScore: number
  kkm: number
  isPassed: boolean
}

export interface SemesterProgressionItem {
  semesterId: string
  semesterName: string
  shortLabel: string
  academicYear: string
  type: 'GANJIL' | 'GENAP'
  isActive: boolean
  className: string
  hasGrades: boolean
  averageScore: number
  totalSubjects: number
  passedSubjectsCount: number
  highestScore: number
  lowestScore: number
  deltaFromPrevious: number | null
  trend: 'up' | 'down' | 'neutral' | 'none'
  subjects: SubjectScoreItem[]
}

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'])
  const query = getQuery(event)

  let studentId = query.studentId as string | undefined

  if (user.role === 'STUDENT') {
    const student = await db.student.findUnique({
      where: { userId: user.id }
    })
    if (!student) {
      throw createError({ statusCode: 404, message: 'Data profil siswa tidak ditemukan' })
    }
    studentId = student.id
  } else {
    if (!studentId) {
      throw createError({ statusCode: 400, message: 'Parameter studentId wajib diisi' })
    }
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          fullname: true,
          email: true
        }
      }
    }
  })

  if (!student) {
    throw createError({ statusCode: 404, message: 'Siswa tidak ditemukan' })
  }

  // 1. Ambil seluruh pendaftaran kelas siswa
  const studentClasses = await db.studentClass.findMany({
    where: { studentId: student.id },
    include: {
      classroom: true,
      semester: {
        include: {
          academicYear: true
        }
      }
    }
  })

  // 2. Ambil seluruh GradeSummary siswa
  const gradeSummaries = await db.gradeSummary.findMany({
    where: { studentId: student.id },
    include: {
      teaching: {
        include: {
          subject: true,
          classroom: true
        }
      },
      semester: {
        include: {
          academicYear: true
        }
      }
    }
  })

  // 3. Kumpulkan semua semester yang diikuti siswa
  const semesterMap = new Map<string, {
    id: string
    type: 'GANJIL' | 'GENAP'
    isActive: boolean
    academicYearName: string
    className: string
    classroomId: string
  }>()

  for (const sc of studentClasses) {
    semesterMap.set(sc.semesterId, {
      id: sc.semester.id,
      type: sc.semester.type as 'GANJIL' | 'GENAP',
      isActive: sc.semester.isActive,
      academicYearName: sc.semester.academicYear?.name || '-',
      className: sc.classroom.name,
      classroomId: sc.classroomId
    })
  }

  for (const gs of gradeSummaries) {
    if (!semesterMap.has(gs.semesterId)) {
      semesterMap.set(gs.semesterId, {
        id: gs.semester.id,
        type: gs.semester.type as 'GANJIL' | 'GENAP',
        isActive: gs.semester.isActive,
        academicYearName: gs.semester.academicYear?.name || '-',
        className: gs.teaching.classroom.name,
        classroomId: gs.teaching.classroomId
      })
    }
  }

  // 4. Urutkan semester secara kronologis (dari semester terlama ke semester terbaru)
  const sortedSemesters = Array.from(semesterMap.values()).sort((a, b) => {
    const yearCmp = a.academicYearName.localeCompare(b.academicYearName)
    if (yearCmp !== 0) return yearCmp
    // GANJIL duluan (1), lalu GENAP (2)
    const weightA = a.type === 'GANJIL' ? 1 : 2
    const weightB = b.type === 'GANJIL' ? 1 : 2
    return weightA - weightB
  })

  // 5. Ambil GradeComponent untuk course terkait jika GradeSummary belum terisi
  const courseIdsSet = new Set<number>()
  for (const gs of gradeSummaries) {
    if (gs.teaching.courseId) courseIdsSet.add(gs.teaching.courseId)
  }

  // 6. Hitung performa nilai per semester
  const history: SemesterProgressionItem[] = []

  for (const sem of sortedSemesters) {
    // Ambil penugasan mengajar di kelas ini untuk semester ini
    const teachings = await db.teachingAssignment.findMany({
      where: {
        classroomId: sem.classroomId,
        semesterId: sem.id
      },
      include: {
        subject: true,
        course: true
      }
    })

    const semSummaries = gradeSummaries.filter(g => g.semesterId === sem.id)
    const subjectsMap = new Map<string, {
      subjectName: string
      subjectCode: string
      kkm: number
      ph?: number
      sts?: number
      sas?: number
    }>()

    // Masukkan dari teachings
    for (const t of teachings) {
      subjectsMap.set(t.id, {
        subjectName: t.subject.name,
        subjectCode: t.subject.code,
        kkm: t.subject.kkm || 75
      })
    }

    // Masukkan skor dari GradeSummary
    for (const s of semSummaries) {
      let item = subjectsMap.get(s.teachingId)
      if (!item) {
        item = {
          subjectName: s.teaching.subject.name,
          subjectCode: s.teaching.subject.code,
          kkm: s.teaching.subject.kkm || 75
        }
        subjectsMap.set(s.teachingId, item)
      }
      if (s.category === 'PH') item.ph = s.score
      if (s.category === 'STS') item.sts = s.score
      if (s.category === 'SAS') item.sas = s.score
    }

    // Fallback: jika GradeSummary belum ada, ambil dari GradeComponent
    const courseIds = teachings.map(t => t.courseId).filter((id): id is number => id !== null && id !== undefined)
    if (courseIds.length > 0) {
      const gradeComponents = await db.gradeComponent.findMany({
        where: {
          studentId: student.id,
          gradeItem: { courseId: { in: courseIds } }
        },
        include: { gradeItem: true }
      })

      for (const t of teachings) {
        const item = subjectsMap.get(t.id)
        if (item && t.courseId) {
          const courseComponents = gradeComponents.filter(gc => gc.gradeItem?.courseId === t.courseId)
          if (item.ph === undefined) {
            const phComponents = courseComponents.filter(gc => gc.gradeItem?.category === 'PH' || (!gc.gradeItem?.category && gc.gradeItem?.name))
            if (phComponents.length > 0) {
              const sum = phComponents.reduce((acc, curr) => acc + (curr.score ?? 0), 0)
              item.ph = Math.round(sum / phComponents.length)
            }
          }
          if (item.sts === undefined) {
            const stsComp = courseComponents.find(gc => gc.gradeItem?.category === 'STS')
            if (stsComp && stsComp.score !== null) item.sts = Math.round(stsComp.score)
          }
          if (item.sas === undefined) {
            const sasComp = courseComponents.find(gc => gc.gradeItem?.category === 'SAS')
            if (sasComp && sasComp.score !== null) item.sas = Math.round(sasComp.score)
          }
        }
      }
    }

    // Hitung finalScore per mata pelajaran
    const subjects: SubjectScoreItem[] = []
    for (const item of subjectsMap.values()) {
      const ph = item.ph
      const sts = item.sts
      const sas = item.sas

      let finalScore: number | null = null
      if (ph !== undefined || sts !== undefined || sas !== undefined) {
        if (ph !== undefined && sts !== undefined && sas !== undefined) {
          finalScore = Math.round((ph * 0.5) + (sts * 0.25) + (sas * 0.25))
        } else {
          const available: { score: number, weight: number }[] = []
          if (ph !== undefined) available.push({ score: ph, weight: 0.5 })
          if (sts !== undefined) available.push({ score: sts, weight: 0.25 })
          if (sas !== undefined) available.push({ score: sas, weight: 0.25 })

          const totalWeight = available.reduce((acc, curr) => acc + curr.weight, 0)
          const weightedSum = available.reduce((acc, curr) => acc + (curr.score * curr.weight), 0)
          finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
        }
      }

      if (finalScore !== null && !isNaN(finalScore)) {
        subjects.push({
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          finalScore,
          kkm: item.kkm,
          isPassed: finalScore >= item.kkm
        })
      }
    }

    const hasGrades = subjects.length > 0
    let averageScore = 0
    let highestScore = 0
    let lowestScore = 0
    let passedSubjectsCount = 0

    if (hasGrades) {
      const sum = subjects.reduce((acc, curr) => acc + curr.finalScore, 0)
      averageScore = Math.round((sum / subjects.length) * 10) / 10
      highestScore = Math.max(...subjects.map(s => s.finalScore))
      lowestScore = Math.min(...subjects.map(s => s.finalScore))
      passedSubjectsCount = subjects.filter(s => s.isPassed).length
    }

    const typeLabel = sem.type === 'GENAP' ? 'Genap' : 'Ganjil'
    // Format shortLabel: "Ganjil 24/25" atau "Genap 24/25"
    const yrParts = sem.academicYearName.split('/')
    const shortYear = yrParts.length === 2 && yrParts[0] && yrParts[1]
      ? `${yrParts[0].slice(-2)}/${yrParts[1].slice(-2)}`
      : sem.academicYearName
    const shortLabel = `${typeLabel} ${shortYear}`

    history.push({
      semesterId: sem.id,
      semesterName: `Semester ${typeLabel} ${sem.academicYearName}`,
      shortLabel,
      academicYear: sem.academicYearName,
      type: sem.type,
      isActive: sem.isActive,
      className: sem.className,
      hasGrades,
      averageScore,
      totalSubjects: subjects.length,
      passedSubjectsCount,
      highestScore,
      lowestScore,
      deltaFromPrevious: null,
      trend: 'none',
      subjects
    })
  }

  // 7. Hitung delta dan trend antar semester
  let lastScoreWithGrades: number | null = null
  for (let i = 0; i < history.length; i++) {
    const curr = history[i]
    if (!curr) continue

    if (curr.hasGrades) {
      if (lastScoreWithGrades !== null) {
        const delta = Math.round((curr.averageScore - lastScoreWithGrades) * 10) / 10
        curr.deltaFromPrevious = delta
        curr.trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'
      }
      lastScoreWithGrades = curr.averageScore
    }
  }

  // 8. Statistik keseluruhan
  const validHistories = history.filter(h => h.hasGrades && h.averageScore > 0)
  const latestAverage = validHistories.length > 0 ? (validHistories[validHistories.length - 1]?.averageScore ?? 0) : 0
  const highestAverage = validHistories.length > 0 ? Math.max(...validHistories.map(h => h.averageScore)) : 0
  const firstAverage = validHistories.length > 0 ? (validHistories[0]?.averageScore ?? 0) : 0
  const overallDelta = validHistories.length >= 2 ? Math.round((latestAverage - firstAverage) * 10) / 10 : 0
  const overallTrend = overallDelta > 0 ? 'up' : overallDelta < 0 ? 'down' : validHistories.length >= 2 ? 'neutral' : 'none'

  return {
    status: 'success',
    data: {
      student: {
        id: student.id,
        nis: student.nis,
        fullname: student.user.fullname
      },
      overallStats: {
        totalSemesters: history.length,
        gradedSemestersCount: validHistories.length,
        latestAverage,
        highestAverage,
        firstAverage,
        overallDelta,
        overallTrend
      },
      history
    }
  }
})
