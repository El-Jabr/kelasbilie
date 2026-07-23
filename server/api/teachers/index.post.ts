import { prisma } from '../../utils/db'
import { createTeacherSchema } from '~~/shared/schemas/teacher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, createTeacherSchema.parse)
    const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } })

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Akun pengguna tidak ditemukan.' })
    }

    const teacher = await prisma.teacher.create({
      data: { userId: body.userId, nip: body.nip.trim() },
      select: {
        id: true,
        userId: true,
        nip: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Guru berhasil ditambahkan.', data: teacher }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIP atau akun pengguna sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to create teacher.' })
  }
})
