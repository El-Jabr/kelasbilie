import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Guru wajib diisi.'
    })
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      nip: true,
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          role: true,
          isActive: true
        }
      }
    }
  })

  if (!teacher) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data guru tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: teacher
  }
})
