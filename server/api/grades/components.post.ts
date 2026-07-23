import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { calculateGradeSummary } from '../../utils/grades'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody(event)
  const items = Array.isArray(body?.items) ? body.items : [body]

  if (!items.length || !items[0]?.studentId || !items[0]?.gradeItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data nilai tidak valid.'
    })
  }

  const results = []
  for (const item of items) {
    const studentId = String(item.studentId)
    const gradeItemId = Number(item.gradeItemId)
    const score = Number(item.score ?? 0)

    const updated = await prisma.gradeComponent.upsert({
      where: {
        studentId_gradeItemId: {
          studentId,
          gradeItemId
        }
      },
      update: {
        score,
        isManual: true,
        lastSync: new Date()
      },
      create: {
        studentId,
        gradeItemId,
        score,
        isManual: true,
        lastSync: new Date()
      }
    })
    results.push(updated)
  }

  // Jika teachingId dan semesterId diberikan, hitung ulang GradeSummary secara otomatis
  if (body?.teachingId && body?.semesterId) {
    try {
      await calculateGradeSummary(body.teachingId, body.semesterId)
    } catch (e) {
      console.error('Auto calculate grade summary error:', e)
    }
  }

  return {
    success: true,
    message: 'Nilai berhasil disimpan.',
    data: results
  }
})
