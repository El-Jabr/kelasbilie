import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN'])

  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID User wajib diisi.'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            _count: { select: { classes: true, gradeComponents: true, gradeSummaries: true, enrollments: true } }
          }
        },
        teacher: {
          select: {
            id: true,
            _count: { select: { teachings: true, homerooms: true } }
          }
        }
      }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User tidak ditemukan.'
      })
    }

    if (user.student) {
      const used = user.student._count.classes + user.student._count.gradeComponents + user.student._count.gradeSummaries + user.student._count.enrollments
      if (used > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'User tidak dapat dihapus karena data siswa masih memiliki kelas atau nilai.'
        })
      }
    }

    if (user.teacher) {
      const used = user.teacher._count.teachings + user.teacher._count.homerooms
      if (used > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'User tidak dapat dihapus karena data guru masih memiliki jadwal mengajar atau wali kelas.'
        })
      }
    }

    await prisma.$transaction(async (tx) => {
      if (user.student) {
        await tx.student.delete({ where: { id: user.student.id } })
      }
      if (user.teacher) {
        await tx.teacher.delete({ where: { id: user.teacher.id } })
      }
      await tx.user.delete({
        where: { id }
      })
    })

    return {
      success: true,
      message: 'User berhasil dihapus.'
    }
  } catch (error: any) {
    console.error('Error deleting user:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User tidak ditemukan.'
      })
    }

    if (error?.code === 'P2003') {
      throw createError({
        statusCode: 400,
        statusMessage: 'User tidak bisa dihapus karena masih terhubung ke data lain.'
      })
    }

    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menghapus user.'
    })
  }
})
