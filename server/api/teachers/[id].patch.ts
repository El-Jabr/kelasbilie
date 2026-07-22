import { prisma } from '../../utils/db'
import { updateTeacherSchema } from '~~/shared/schemas/teacher'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID guru tidak ditemukan.' })

    const body = await readValidatedBody(event, updateTeacherSchema.parse)
    if (body.userId) {
      const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } })
      if (!user) throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan.' })
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(body.userId !== undefined && { userId: body.userId }),
        ...(body.nip !== undefined && { nip: body.nip.trim() })
      },
      select: {
        id: true,
        userId: true,
        nip: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Guru berhasil diperbarui.', data: teacher }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Guru tidak ditemukan.' })
    }
    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIP atau akun pengguna sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to update teacher.' })
  }
})
