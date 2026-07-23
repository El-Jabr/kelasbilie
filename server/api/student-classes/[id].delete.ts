import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Pembagian Kelas wajib diisi.'
      })
    }

    await prisma.studentClass.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Siswa berhasil dikeluarkan dari kelas.'
    }
  } catch (error: any) {
    console.error('Error deleting student class:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data pembagian kelas tidak ditemukan.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengeluarkan siswa dari kelas.'
    })
  }
})
