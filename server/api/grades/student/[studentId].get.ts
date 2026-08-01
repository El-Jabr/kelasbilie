import { prisma } from '../../../utils/db'
import { getUserFromEvent } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  const studentId = getRouterParam(event, 'studentId')

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter studentId wajib diisi.'
    })
  }

  // Jika user yang login adalah SISWA, pastikan ia hanya bisa melihat nilainya sendiri
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (!student || student.id !== studentId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Akses ditolak. Anda hanya dapat melihat nilai Anda sendiri.'
      })
    }
  }

  try {
    const query = getQuery(event)
    let semesterId = query.semesterId as string

    // 1. Tentukan Semester Aktif jika tidak dikirim dari query
    if (!semesterId) {
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true }
      })
      if (activeSemester) {
        semesterId = activeSemester.id
      }
    }

    if (!semesterId) {
      return {
        status: 'success',
        data: []
      }
    }

    // 2. Cari Pendaftaran Kelas Siswa (StudentClass) pada Semester ini
    const studentClass = await prisma.studentClass.findFirst({
      where: {
        studentId,
        semesterId
      },
      include: {
        classroom: true
      }
    })

    if (!studentClass) {
      return {
        status: 'success',
        data: []
      }
    }

    // 3. Ambil Semua Penugasan Mengajar (TeachingAssignment) di Kelas Siswa pada Semester ini
    const teachings = await prisma.teachingAssignment.findMany({
      where: {
        classroomId: studentClass.classroomId,
        semesterId
      },
      include: {
        subject: true,
        classroom: true,
        teacher: {
          include: {
            user: {
              select: {
                fullname: true
              }
            }
          }
        }
      },
      orderBy: {
        subject: {
          name: 'asc'
        }
      }
    })

    if (!teachings.length) {
      return {
        status: 'success',
        data: []
      }
    }

    const teachingIds = teachings.map(t => t.id)
    const courseIds = teachings.map(t => t.courseId).filter((id): id is number => id !== null && id !== undefined)

    // 4. Ambil GradeSummaries yang sudah ada
    const summaries = await prisma.gradeSummary.findMany({
      where: {
        studentId,
        semesterId,
        teachingId: { in: teachingIds }
      }
    })

    // 5. Ambil GradeComponents untuk backup kalkulasi nilai PH/STS/SAS per course jika GradeSummary belum terhitung
    const gradeComponents = courseIds.length > 0 ? await prisma.gradeComponent.findMany({
      where: {
        studentId,
        gradeItem: {
          courseId: { in: courseIds }
        }
      },
      include: {
        gradeItem: true
      }
    }) : []

    // 6. Susun Rekapitulasi Nilai Per Mata Pelajaran
    const resultList = teachings.map((teaching) => {
      const subjectSummaries = summaries.filter(s => s.teachingId === teaching.id)
      
      let phScore: number | null = null
      let stsScore: number | null = null
      let sasScore: number | null = null

      // Prioritas 1: Ambil dari GradeSummary
      const summaryPH = subjectSummaries.find(s => s.category === 'PH')
      const summarySTS = subjectSummaries.find(s => s.category === 'STS')
      const summarySAS = subjectSummaries.find(s => s.category === 'SAS')

      if (summaryPH !== undefined) phScore = summaryPH.score
      if (summarySTS !== undefined) stsScore = summarySTS.score
      if (summarySAS !== undefined) sasScore = summarySAS.score

      // Prioritas 2: Jika belum ada di GradeSummary, hitung langsung dari GradeComponent
      if (teaching.courseId) {
        const courseComponents = gradeComponents.filter(gc => gc.gradeItem?.courseId === teaching.courseId)

        if (phScore === null) {
          const phComponents = courseComponents.filter(gc => gc.gradeItem?.category === 'PH' || (!gc.gradeItem?.category && gc.gradeItem?.name))
          if (phComponents.length > 0) {
            const sum = phComponents.reduce((acc, curr) => acc + (curr.score ?? 0), 0)
            phScore = Math.round(sum / phComponents.length)
          }
        }

        if (stsScore === null) {
          const stsComp = courseComponents.find(gc => gc.gradeItem?.category === 'STS')
          if (stsComp && stsComp.score !== null) stsScore = Math.round(stsComp.score)
        }

        if (sasScore === null) {
          const sasComp = courseComponents.find(gc => gc.gradeItem?.category === 'SAS')
          if (sasComp && sasComp.score !== null) sasScore = Math.round(sasComp.score)
        }
      }

      // Hitung Nilai Akhir (Formula: 50% Avg PH + 25% STS + 25% SAS, atau pembagian dari nilai yang tersedia)
      let finalScore: number | null = null
      
      if (phScore !== null || stsScore !== null || sasScore !== null) {
        if (phScore !== null && stsScore !== null && sasScore !== null) {
          finalScore = Math.round((phScore * 0.5) + (stsScore * 0.25) + (sasScore * 0.25))
        } else {
          const available: { score: number, weight: number }[] = []
          if (phScore !== null) available.push({ score: phScore, weight: 0.5 })
          if (stsScore !== null) available.push({ score: stsScore, weight: 0.25 })
          if (sasScore !== null) available.push({ score: sasScore, weight: 0.25 })

          const totalWeight = available.reduce((acc, curr) => acc + curr.weight, 0)
          const weightedSum = available.reduce((acc, curr) => acc + (curr.score * curr.weight), 0)
          finalScore = Math.round(weightedSum / totalWeight)
        }
      }

      return {
        teachingId: teaching.id,
        subjectCode: teaching.subject?.code || '-',
        subjectName: teaching.subject?.name || 'Mata Pelajaran',
        classroomName: teaching.classroom?.name || '-',
        teacherName: teaching.teacher?.user?.fullname || '-',
        courseId: teaching.courseId,
        grades: {
          PH: phScore,
          STS: stsScore,
          SAS: sasScore
        },
        finalScore
      }
    })

    return {
      status: 'success',
      data: resultList
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching student grades:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data nilai siswa.'
    })
  }
})
