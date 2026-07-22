import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)
  const search = String(query.search ?? '').trim()

  const where = {
    ...(search && {
      OR: [
        { nip: { contains: search, mode: 'insensitive' as const } },
        { user: { username: { contains: search, mode: 'insensitive' as const } } },
        { user: { fullname: { contains: search, mode: 'insensitive' as const } } }
      ]
    })
  }

  const [total, teachers] = await prisma.$transaction([
    prisma.teacher.count({ where }),
    prisma.teacher.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nip: 'asc' },
      select: {
        id: true,
        userId: true,
        nip: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })
  ])

  return {
    data: teachers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  }
})
