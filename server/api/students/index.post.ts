import { prisma } from '../../utils/db'
import { createStudentSchema } from '~~/shared/schemas/student'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, createStudentSchema.parse)
    const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } })

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan.' })
    }

    const student = await prisma.student.create({
      data: { userId: body.userId, nis: body.nis.trim() },
      select: {
        id: true,
        userId: true,
        nis: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Siswa berhasil ditambahkan.', data: student }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIS atau akun pengguna sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to create student.' })
  }
})
