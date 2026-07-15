import { prisma } from '../../utils/db'

const VALID_SORT = [
  'username',
  'fullname',
  'email',
  'role',
  'createdAt'
] as const

type SortField = typeof VALID_SORT[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)

  const search = String(query.search ?? '').trim()

  const role = String(query.role ?? '').trim()

  const active = String(query.active ?? '').trim()

  const sort = VALID_SORT.includes(query.sort as SortField)
    ? (query.sort as SortField)
    : 'createdAt'

  const order = query.order === 'asc'
    ? 'asc'
    : 'desc'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (search) {
    where.OR = [
      {
        username: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        fullname: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        email: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ]
  }

  if (role && role !== 'ALL') {
    where.role = role
  }

  if (active === 'true') {
    where.isActive = true
  }

  if (active === 'false') {
    where.isActive = false
  }

  const [total, users] = await prisma.$transaction([
    prisma.user.count({
      where
    }),

    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },

      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        role: true,
        moodleUserId: true,
        isActive: true,
        createdAt: true
      }
    })
  ])

  return {
    data: users,

    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
