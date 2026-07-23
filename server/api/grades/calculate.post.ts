import { requireRole } from '../../utils/auth'
import { calculateGradeSummary } from '../../utils/grades'

export default defineEventHandler(async (event) => {
  // Hanya SUPER_ADMIN, ADMIN, dan TEACHER yang diizinkan memicu kalkulasi nilai
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  try {
    const body = await readBody(event)

    if (!body?.teachingId || !body?.semesterId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'teachingId dan semesterId wajib diisi.'
      })
    }

    const result = await calculateGradeSummary(body.teachingId, body.semesterId)

    return {
      status: 'success',
      message: 'Kalkulasi nilai berhasil diperbarui.',
      data: result
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error calculating grades:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal melakukan kalkulasi nilai.'
    })
  }
})
