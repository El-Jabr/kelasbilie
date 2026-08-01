import { prisma } from '../../utils/db'

export default defineEventHandler(async () => {
  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  })

  if (!activeSemester) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Semester aktif tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: activeSemester
  }
})
