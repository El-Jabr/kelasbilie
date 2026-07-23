import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  try {
    const query = getQuery(event)
    const categoryId = query.categoryId ? Number(query.categoryId) : undefined

    const courses = await prisma.course.findMany({
      where: {
        ...(categoryId && { categoryId })
      },
      include: {
        category: true,
        _count: {
          select: {
            enrollments: true,
            gradeItems: true
          }
        }
      },
      orderBy: {
        fullname: 'asc'
      }
    })

    return {
      status: 'success',
      data: courses
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching moodle courses:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil daftar course Moodle.'
    })
  }
})
