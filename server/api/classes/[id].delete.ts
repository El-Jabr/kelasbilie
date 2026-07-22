import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID kelas tidak ditemukan.'
      })
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            students: true,
            teachings: true,
            homerooms: true
          }
        }
      }
    })

    if (!classroom) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kelas tidak ditemukan.'
      })
    }

    const used
      = classroom._count.students
        + classroom._count.teachings
        + classroom._count.homerooms

    if (used > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Kelas masih digunakan dan tidak dapat dihapus.'
      })
    }

    await prisma.classroom.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Kelas berhasil dihapus.'
    }
  } catch (error) {
    console.error('Error deleting class:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete class.'
    })
  }
})
