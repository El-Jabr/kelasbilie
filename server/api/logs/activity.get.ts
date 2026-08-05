import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20))
  const skip = (page - 1) * limit

  const category = query.category ? String(query.category) : undefined
  const status = query.status ? String(query.status) : undefined
  const search = query.search ? String(query.search).trim() : undefined

  const where: any = {}

  if (category) {
    where.category = category
  }

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { userName: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { errorMessage: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            username: true,
            role: true
          }
        }
      }
    })
  ])

  return {
    success: true,
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
