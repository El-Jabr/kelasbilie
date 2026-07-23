import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)
  const semesterId = String(query.semesterId ?? '').trim()
  const classroomId = String(query.classroomId ?? '').trim()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (semesterId) where.semesterId = semesterId
  if (classroomId) where.classroomId = classroomId

  const [total, studentClasses] = await prisma.$transaction([
    prisma.studentClass.count({ where }),

    prisma.studentClass.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        semesterId: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            nis: true,
            user: { select: { id: true, username: true, fullname: true, email: true } }
          }
        },
        classroom: {
          select: {
            id: true,
            name: true,
            level: true,
            room: true,
            building: true
          }
        },
        semester: {
          select: {
            id: true,
            type: true,
            isActive: true,
            academicYear: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
  ])

  return {
    data: studentClasses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
