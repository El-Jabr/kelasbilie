import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID penugasan mengajar tidak ditemukan.' })

    const teaching = await prisma.teachingAssignment.findUnique({
      where: { id },
      select: { id: true, _count: { select: { gradeSummaries: true } } }
    })

    if (!teaching) throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan.' })
    if (teaching._count.gradeSummaries > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Penugasan mengajar masih memiliki data rekap nilai dan tidak dapat dihapus.' })
    }

    await prisma.teachingAssignment.delete({ where: { id } })

    return { success: true, message: 'Penugasan mengajar berhasil dihapus.' }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus penugasan mengajar.' })
  }
})
