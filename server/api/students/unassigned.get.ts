import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const query = getQuery(event)
  const semesterId = String(query.semesterId || '').trim()
  const search = String(query.search || '').trim()

  let activeSemesterId = semesterId
  if (!activeSemesterId) {
    const activeSem = await prisma.semester.findFirst({ where: { isActive: true } })
    if (activeSem) {
      activeSemesterId = activeSem.id
    }
  }

  if (!activeSemesterId) {
    return { status: 'success', data: [] }
  }

  const unassignedStudents = await prisma.student.findMany({
    where: {
      studentClasses: {
        none: {
          semesterId: activeSemesterId
        }
      },
      ...(search && {
        OR: [
          { nis: { contains: search, mode: 'insensitive' } },
          { user: { fullname: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      })
    },
    include: {
      user: {
        select: {
          id: true,
          fullname: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: {
      user: {
        fullname: 'asc'
      }
    }
  })

  return {
    status: 'success',
    data: unassignedStudents
  }
})
