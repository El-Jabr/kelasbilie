import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  try {
    const query = getQuery(event)
    const limit = Number(query.limit) || 20

    const logs = await prisma.syncLog.findMany({
      take: limit,
      orderBy: {
        syncedAt: 'desc'
      }
    })

    return {
      status: 'success',
      data: logs
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching sync logs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil riwayat log sinkronisasi.'
    })
  }
})
