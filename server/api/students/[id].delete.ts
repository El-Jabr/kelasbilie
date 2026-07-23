import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID siswa tidak ditemukan.' })

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: { classes: true, gradeComponents: true, gradeSummaries: true, enrollments: true }
        }
      }
    })

    if (!student) throw createError({ statusCode: 404, statusMessage: 'Siswa tidak ditemukan.' })
    const used
      = student._count.classes
        + student._count.gradeComponents
        + student._count.gradeSummaries
        + student._count.enrollments
    if (used > 0) throw createError({ statusCode: 409, statusMessage: 'Siswa masih digunakan dan tidak dapat dihapus.' })

    await prisma.student.delete({ where: { id } })
    return { success: true, message: 'Siswa berhasil dihapus.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete student.' })
  }
})
