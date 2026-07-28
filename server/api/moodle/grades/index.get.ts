import { prisma } from '../../../utils/db'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15))
  const skip = (page - 1) * limit

  const search = (query.search as string || '').trim()
  const courseId = query.courseId ? Number(query.courseId) : undefined
  const category = (query.category as string || '').trim().toUpperCase()

  // Dynamic filter clause
  const where: any = {}

  if (courseId) {
    where.gradeItem = { ...where.gradeItem, courseId }
  }

  if (category && ['PH', 'STS', 'SAS'].includes(category)) {
    where.gradeItem = { ...where.gradeItem, category }
  }

  if (search) {
    where.OR = [
      { student: { user: { fullname: { contains: search, mode: 'insensitive' } } } },
      { student: { nis: { contains: search, mode: 'insensitive' } } },
      { student: { user: { username: { contains: search, mode: 'insensitive' } } } },
      { gradeItem: { name: { contains: search, mode: 'insensitive' } } },
      { gradeItem: { course: { fullname: { contains: search, mode: 'insensitive' } } } }
    ]
  }

  try {
    const [total, gradeComponents, totalGradeItems, totalManual] = await Promise.all([
      prisma.gradeComponent.count({ where }),
      prisma.gradeComponent.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { lastSync: 'desc' },
          { id: 'desc' }
        ],
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullname: true,
                  username: true,
                  email: true,
                  moodleUserId: true
                }
              }
            }
          },
          gradeItem: {
            include: {
              course: {
                select: {
                  id: true,
                  fullname: true,
                  shortname: true
                }
              }
            }
          }
        }
      }),
      prisma.gradeItem.count(),
      prisma.gradeComponent.count({ where: { isManual: true } })
    ])

    return {
      status: 'success',
      data: gradeComponents,
      stats: {
        totalComponents: total,
        totalGradeItems,
        totalManual,
        totalAutoSynced: total - totalManual
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    }
  } catch (error: any) {
    console.error('Error fetching moodle grade inspection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data inspeksi nilai Moodle.'
    })
  }
})
