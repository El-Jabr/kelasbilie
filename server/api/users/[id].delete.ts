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

    await prisma.user.delete({
      where: { id }
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
