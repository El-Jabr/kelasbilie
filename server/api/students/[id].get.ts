import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Siswa wajib diisi.'
    })
  }

  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      nis: true,
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

  if (!student) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data siswa tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: student
  }
})
