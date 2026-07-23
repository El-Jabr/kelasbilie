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
        studentId,
        ...(semesterId && { semesterId })
      },
      include: {
        teaching: {
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
          }
        }
      }
    })

    // Grouping nilai per mata pelajaran (TeachingAssignment)
    const groupedMap = new Map<string, any>()

    for (const item of summaries) {
      const teachingId = item.teachingId
      if (!groupedMap.has(teachingId)) {
        groupedMap.set(teachingId, {
          teachingId,
          subjectCode: item.teaching.subject.code,
          subjectName: item.teaching.subject.name,
          classroomName: item.teaching.classroom.name,
          teacherName: item.teaching.teacher.user.fullname,
          grades: {}
        })
      }

      const record = groupedMap.get(teachingId)
      record.grades[item.category] = item.score
    }

    const resultList = Array.from(groupedMap.values()).map((subjectData) => {
      const ph = subjectData.grades.PH ?? null
      const sts = subjectData.grades.STS ?? null
      const sas = subjectData.grades.SAS ?? null

      const validScores = [ph, sts, sas].filter((val) => val !== null) as number[]
      const finalScore =
        validScores.length > 0
          ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
          : null

      return {
        ...subjectData,
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
