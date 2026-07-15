import { prisma } from '../../utils/db'

const VALID_SORT = [
  'name',
  'createdAt'
] as const

type SortField = (typeof VALID_SORT)[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)

  const search = String(query.search ?? '').trim()

  const active = String(query.active ?? '').trim()

  const sort = VALID_SORT.includes(query.sort as SortField)
    ? (query.sort as SortField)
    : 'createdAt'

  const order = query.order === 'asc'
    ? 'asc'
    : 'desc'

  const where = {
    ...(search && {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    }),

    ...(active === 'true' && {
      isActive: true
    }),

    ...(active === 'false' && {
      isActive: false
    })
  }

  const [total, academicYears] = await prisma.$transaction([
    prisma.academicYear.count({
      where
    }),

    prisma.academicYear.findMany({
      where,

      skip: (page - 1) * limit,

      take: limit,

      orderBy: {
        [sort]: order
      },

      select: {
        id: true,
        name: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true
      }
    })
  ])

  return {
    data: academicYears,

    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
