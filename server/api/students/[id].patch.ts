import { prisma } from '../../utils/db'
import { updateStudentSchema } from '~~/shared/schemas/student'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID siswa tidak ditemukan.' })

    const body = await readValidatedBody(event, updateStudentSchema.parse)
    if (body.userId) {
      const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } })
      if (!user) throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan.' })
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(body.userId !== undefined && { userId: body.userId }),
        ...(body.nis !== undefined && { nis: body.nis.trim() })
      },
      select: {
        id: true,
        userId: true,
        nis: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Siswa berhasil diperbarui.', data: student }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Siswa tidak ditemukan.' })
    }
    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIS atau akun pengguna sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to update student.' })
  }
})
