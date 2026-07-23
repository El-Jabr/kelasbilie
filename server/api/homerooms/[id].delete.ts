import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Wali Kelas wajib diisi.'
      })
    }

    await prisma.homeroomAssignment.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Penugasan wali kelas berhasil dihapus.'
    }
  } catch (error: any) {
    console.error('Error deleting homeroom assignment:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Penugasan wali kelas tidak ditemukan.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menghapus wali kelas.'
    })
  }
})
