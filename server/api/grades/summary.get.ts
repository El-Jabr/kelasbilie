import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  try {
    const query = getQuery(event)
    const teachingId = query.teachingId as string
    let semesterId = query.semesterId as string

    if (!teachingId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parameter teachingId wajib diisi.'
      })
    }

    // Jika semesterId tidak dikirim, ambil semester yang sedang aktif
    if (!semesterId) {
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true }
      })
      if (activeSemester) {
        semesterId = activeSemester.id
      }
    }

    const summaries = await prisma.gradeSummary.findMany({
      where: {
        teachingId,
        ...(semesterId && { semesterId })
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullname: true,
                username: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          nis: 'asc'
        }
      }
    })

    // Kelompokkan nilai per siswa agar format JSON lebih rapi bagi frontend
    const groupedMap = new Map<string, any>()

    for (const item of summaries) {
      if (!groupedMap.has(item.studentId)) {
        groupedMap.set(item.studentId, {
          studentId: item.studentId,
          nis: item.student.nis,
          fullname: item.student.user.fullname,
          username: item.student.user.username,
          grades: {}
        })
      }

      const studentRecord = groupedMap.get(item.studentId)
      studentRecord.grades[item.category] = item.score
    }

    const resultList = Array.from(groupedMap.values()).map((studentData) => {
      const ph = studentData.grades.PH ?? null
      const sts = studentData.grades.STS ?? null
      const sas = studentData.grades.SAS ?? null

      // Hitung rata-rata akhir jika nilai tersedia
      const validScores = [ph, sts, sas].filter((val) => val !== null) as number[]
      const finalScore =
        validScores.length > 0
          ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
          : null

      return {
        ...studentData,
        finalScore
      }
    })

    return {
      status: 'success',
      data: resultList
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching grade summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil rekap nilai.'
    })
  }
})
