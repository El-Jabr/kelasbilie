import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID guru tidak ditemukan.' })

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { id: true, _count: { select: { teachings: true, homerooms: true } } }
    })

    if (!teacher) throw createError({ statusCode: 404, statusMessage: 'Guru tidak ditemukan.' })
    if (teacher._count.teachings + teacher._count.homerooms > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Guru masih digunakan dan tidak dapat dihapus.' })
    }

    await prisma.teacher.delete({ where: { id } })
    return { success: true, message: 'Guru berhasil dihapus.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete teacher.' })
  }
})
