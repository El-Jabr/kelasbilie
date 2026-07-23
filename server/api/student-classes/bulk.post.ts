import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = await readBody<{
    classroomId: string
    semesterId: string
    studentIds: string[]
  }>(event)

  if (!body.classroomId || !body.semesterId || !Array.isArray(body.studentIds) || !body.studentIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Classroom ID, Semester ID, dan minimal 1 Student ID wajib diisi.'
    })
  }

  let count = 0
  for (const studentId of body.studentIds) {
    await prisma.studentClass.upsert({
      where: {
        studentId_semesterId: {
          studentId: String(studentId),
          semesterId: String(body.semesterId)
        }
      },
      create: {
        studentId: String(studentId),
        classroomId: String(body.classroomId),
        semesterId: String(body.semesterId)
      },
      update: {
        classroomId: String(body.classroomId)
      }
    })
    count++
  }

  return {
    success: true,
    message: `Berhasil mendaftarkan ${count} siswa ke dalam kelas.`
  }
})
