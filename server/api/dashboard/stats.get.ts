import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      activeYear,
      activeSemester,
      recentLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.classroom.count(),
      prisma.academicYear.findFirst({ where: { isActive: true } }),
      prisma.semester.findFirst({ where: { isActive: true } }),
      prisma.syncLog.findMany({
        take: 5,
        orderBy: { syncedAt: 'desc' }
      })
    ])

    return {
      status: 'success',
      data: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalClasses,
        activeYear,
        activeSemester,
        recentLogs
      }
    }
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data statistik dashboard.'
    })
  }
})
