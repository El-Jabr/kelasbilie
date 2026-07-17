import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const semester = await prisma.semester.findUnique({
      where: { id },

      select: {
        id: true,
        _count: {
          select: {
            studentClasses: true,
            teachingAssignments: true,
            homeroomAssignments: true,
            gradeSummaries: true
          }
        }
      }
    })

    if (!semester) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Semester tidak ditemukan.'
      })
    }

    const used =
      semester._count.studentClasses +
      semester._count.teachingAssignments +
      semester._count.homeroomAssignments +
      semester._count.gradeSummaries

    if (used > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Semester masih digunakan dan tidak dapat dihapus.'
      })
    }

    await prisma.semester.delete({
      where: {
        id
      }
    })

    return {
      success: true,
      message: 'Semester berhasil dihapus.'
    }
  } catch (error) {
    console.error('Error deleting semester:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete semester.'
    })
  }
})
