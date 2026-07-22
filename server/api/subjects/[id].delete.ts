import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID mata pelajaran tidak ditemukan.'
      })
    }

    const subject = await prisma.subject.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            teachings: true
          }
        }
      }
    })

    if (!subject) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Mata pelajaran tidak ditemukan.'
      })
    }

    if (subject._count.teachings > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Mata pelajaran masih digunakan dan tidak dapat dihapus.'
      })
    }

    await prisma.subject.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Mata pelajaran berhasil dihapus.'
    }
  } catch (error) {
    console.error('Error deleting subject:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subject.'
    })
  }
})
