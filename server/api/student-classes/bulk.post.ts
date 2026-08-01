import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

function extractId(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'object') {
    if (val.value) return String(val.value).trim()
    if (val.id) return String(val.id).trim()
  }
  return String(val).trim()
}

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = await readBody<any>(event)

  const itemsToProcess: { studentId: string; classroomId: string; semesterId: string }[] = []

  if (Array.isArray(body?.items) && body.items.length > 0) {
    for (const item of body.items) {
      const studentId = extractId(item?.studentId)
      const classroomId = extractId(item?.classroomId || body?.classroomId)
      const semesterId = extractId(item?.semesterId || body?.semesterId)
      if (studentId && classroomId && semesterId) {
        itemsToProcess.push({ studentId, classroomId, semesterId })
      }
    }
  } else if (Array.isArray(body?.studentIds) && body.studentIds.length > 0) {
    const classroomId = extractId(body?.classroomId)
    const semesterId = extractId(body?.semesterId)
    for (const rawStudentId of body.studentIds) {
      const studentId = extractId(rawStudentId)
      if (studentId && classroomId && semesterId) {
        itemsToProcess.push({ studentId, classroomId, semesterId })
      }
    }
  }

  if (itemsToProcess.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Classroom ID, Semester ID, dan minimal 1 Student ID wajib diisi.'
    })
  }

  let count = 0
  for (const item of itemsToProcess) {
    await prisma.studentClass.upsert({
      where: {
        studentId_semesterId: {
          studentId: item.studentId,
          semesterId: item.semesterId
        }
      },
      create: {
        studentId: item.studentId,
        classroomId: item.classroomId,
        semesterId: item.semesterId
      },
      update: {
        classroomId: item.classroomId
      }
    })
    count++
  }

  return {
    success: true,
    message: `Berhasil mendaftarkan ${count} siswa ke dalam kelas.`
  }
})
