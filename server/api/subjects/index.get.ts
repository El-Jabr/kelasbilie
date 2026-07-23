import { prisma } from '../../utils/db'

const VALID_SORT = [
  'code',
  'name'
] as const

type SortField = (typeof VALID_SORT)[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)
  const search = String(query.search ?? '').trim()

  const sort = VALID_SORT.includes(query.sort as SortField)
    ? (query.sort as SortField)
    : 'code'

  const order = query.order === 'desc'
    ? 'desc'
    : 'asc'

  const where = {
    ...(search && {
      OR: [
        {
          code: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          name: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      ]
    })
  }

  const [total, subjects] = await prisma.$transaction([
    prisma.subject.count({ where }),

    prisma.subject.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    })
  ])

  return {
    data: subjects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
