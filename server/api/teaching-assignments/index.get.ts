import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page ?? 1), 1)
  const limit = Math.max(Number(query.limit ?? 10), 1)
  const search = String(query.search ?? '').trim()

  const teacherId = query.teacherId ? String(query.teacherId) : undefined
  const semesterId = query.semesterId ? String(query.semesterId) : undefined
  const activeSemester = query.activeSemester === 'true'

  const where = {
    ...(teacherId && { teacherId }),
    ...(semesterId && { semesterId }),
    ...(activeSemester && { semester: { isActive: true } }),
    ...(search && {
      OR: [
        { teacher: { user: { fullname: { contains: search, mode: 'insensitive' as const } } } },
        { teacher: { user: { username: { contains: search, mode: 'insensitive' as const } } } },
        { teacher: { nip: { contains: search, mode: 'insensitive' as const } } },
        { subject: { name: { contains: search, mode: 'insensitive' as const } } },
        { subject: { code: { contains: search, mode: 'insensitive' as const } } },
        { classroom: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    })
  }

  const [total, teachings] = await prisma.$transaction([
    prisma.teachingAssignment.count({ where }),
    prisma.teachingAssignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        teacherId: true,
        subjectId: true,
        classroomId: true,
        semesterId: true,
        courseId: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: { select: { id: true, username: true, fullname: true } }
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        classroom: {
          select: {
            id: true,
            name: true,
            level: true,
            room: true,
            building: true,
            floor: true
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
        },
        course: {
          select: {
            id: true,
            fullname: true,
            shortname: true
          }
        }
      }
    })
  ])

  return {
    data: teachings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  }
})
