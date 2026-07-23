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
        statusCode: 400,
        statusMessage: 'Mata pelajaran tidak bisa dihapus karena sedang digunakan dalam penugasan mengajar.'
      })
    }

    await prisma.subject.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Mata pelajaran berhasil dihapus.'
    }
  } catch (error: any) {
    console.error('Error deleting subject:', error)

    if (error?.code === 'P2003') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Mata pelajaran tidak bisa dihapus karena sedang digunakan dalam penugasan mengajar.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menghapus mata pelajaran.'
    })
  }
})
