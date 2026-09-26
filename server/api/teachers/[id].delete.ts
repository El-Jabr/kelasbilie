import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID guru tidak ditemukan.' })

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        _count: { select: { teachings: true, homerooms: true } }
      }
    })

    if (!teacher) throw createError({ statusCode: 404, statusMessage: 'Guru tidak ditemukan.' })
    if (teacher._count.teachings + teacher._count.homerooms > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Guru masih memiliki penugasan mengajar/wali kelas dan tidak dapat dihapus.' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } })
      if (teacher.userId) {
        const studentProfile = await tx.student.findUnique({ where: { userId: teacher.userId } })
        if (!studentProfile) {
          await tx.user.delete({ where: { id: teacher.userId } }).catch(() => {})
        }
      }
    })

    return { success: true, message: 'Guru berhasil dihapus.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghapus guru.' })
  }
})
