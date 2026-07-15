import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tahun ajaran tidak ditemukan.'
    })
  }

  try {
    const deleted = await prisma.academicYear.delete({
      where: {
        id
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        isLocked: true
      }
    })

    return {
      success: true,
      message: 'Tahun ajaran berhasil dihapus.',
      data: deleted
    }
  }
  catch (error: any) {
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tahun ajaran tidak ditemukan.'
      })
    }

    if (error.code === 'P2003') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tahun ajaran tidak dapat dihapus karena masih digunakan.'
      })
    }

    throw error
  }
})
