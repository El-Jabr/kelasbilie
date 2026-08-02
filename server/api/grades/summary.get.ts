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

    const teaching = await prisma.teachingAssignment.findUnique({
      where: { id: teachingId }
    })

    if (!teaching) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Penugasan mengajar tidak ditemukan.'
      })
    }

    const targetSemesterId = semesterId || teaching.semesterId

    // 1. Ambil seluruh siswa di kelas penugasan ini
    const studentClasses = await prisma.studentClass.findMany({
      where: {
        classroomId: teaching.classroomId,
        semesterId: targetSemesterId
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
          user: {
            fullname: 'asc'
          }
        }
      }
    })

    // 2. Ambil ringkasan nilai yang tersimpan
    const summaries = await prisma.gradeSummary.findMany({
      where: {
        teachingId,
        semesterId: targetSemesterId
      }
    })

    // 3. Gabungkan seluruh siswa dengan nilai rekapnya
    const resultList = studentClasses.map((sc) => {
      const studentSummaries = summaries.filter(s => s.studentId === sc.studentId)
      const summaryPH = studentSummaries.find(s => s.category === 'PH')
      const summarySTS = studentSummaries.find(s => s.category === 'STS')
      const summarySAS = studentSummaries.find(s => s.category === 'SAS')

      const ph = summaryPH?.score ?? null
      const sts = summarySTS?.score ?? null
      const sas = summarySAS?.score ?? null

      const validScores = [ph, sts, sas].filter((val) => val !== null) as number[]
      const finalScore = validScores.length > 0
        ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
        : null

      return {
        studentId: sc.student.id,
        nis: sc.student.nis,
        fullname: sc.student.user?.fullname || '-',
        username: sc.student.user?.username || '-',
        grades: {
          PH: ph,
          STS: sts,
          SAS: sas
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
    console.error('Error fetching grade summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil rekap nilai.'
    })
  }
})
