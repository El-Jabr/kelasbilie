import { prisma } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  const query = getQuery(event)

  const studentId = query.studentId as string
  let courseId = query.courseId ? Number(query.courseId) : undefined
  const teachingId = query.teachingId as string

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
        statusMessage: 'Akses ditolak. Anda hanya dapat melihat komponen nilai Anda sendiri.'
      })
    }
  }

  try {
    // Jika teachingId dikirim alih-alih courseId, cari courseId dari TeachingAssignment
    if (!courseId && teachingId) {
      const teaching = await prisma.teachingAssignment.findUnique({
        where: { id: teachingId }
      })
      if (teaching) {
        courseId = teaching.courseId
      }
    }

    const components = await prisma.gradeComponent.findMany({
      where: {
        studentId,
        ...(courseId && {
          gradeItem: {
            courseId
          }
        })
      },
      include: {
        gradeItem: {
          select: {
            id: true,
            name: true,
            itemType: true,
            category: true,
            courseId: true
          }
        }
      },
      orderBy: {
        lastSync: 'desc'
      }
    })

    return {
      status: 'success',
      data: components
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching grade components:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil detail komponen nilai.'
    })
  }
})
