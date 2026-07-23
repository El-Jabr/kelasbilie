import { prisma } from '../../utils/db'

const VALID_SORT = [
  'name',
  'level'
] as const

type SortField = (typeof VALID_SORT)[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)
  const search = String(query.search ?? '').trim()
  const level = Number(query.level)

  const sort = VALID_SORT.includes(query.sort as SortField)
    ? (query.sort as SortField)
    : 'name'

  const order = query.order === 'desc'
    ? 'desc'
    : 'asc'

  const where = {
    ...(search && {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    }),

    ...(Number.isInteger(level) && {
      level
    })
  }

  const [total, classes] = await prisma.$transaction([
    prisma.classroom.count({ where }),

    prisma.classroom.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      select: {
        id: true,
        name: true,
        level: true,
        room: true,
        building: true,
        floor: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ])

  return {
    data: classes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
