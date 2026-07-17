import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)

  const academicYearId = String(query.academicYearId ?? '').trim()
  const active = String(query.active ?? '').trim()

  const where = {
    ...(academicYearId && {
      academicYearId
    }),

    ...(active === 'true' && {
      isActive: true
    }),

    ...(active === 'false' && {
      isActive: false
    })
  }

  const [total, semesters] = await prisma.$transaction([
    prisma.semester.count({
      where
    }),

    prisma.semester.findMany({
      where,

      skip: (page - 1) * limit,

      take: limit,

      orderBy: [
        {
          academicYear: {
            name: 'desc'
          }
        },
        {
          type: 'asc'
        }
      ],

      select: {
        id: true,
        type: true,

        isActive: true,
        isLocked: true,

        createdAt: true,
        updatedAt: true,

        academicYear: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  ])

  return {
    data: semesters,

    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
