import { prisma } from '../../utils/db'
import { requireRole, getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['TEACHER', 'ADMIN', 'SUPER_ADMIN'])
  const currentUser = getUserFromEvent(event)

  const teacher = await prisma.teacher.findFirst({
    where: { userId: currentUser.id }
  })

  if (!teacher) {
    return { data: null }
  }

  const query = getQuery(event)
  const requestedSemesterId = String(query.semesterId || '').trim()

  let targetSemesterId = requestedSemesterId && requestedSemesterId !== 'ACTIVE' ? requestedSemesterId : null

  if (!targetSemesterId) {
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    })
    if (activeSemester) {
      targetSemesterId = activeSemester.id
    }
  }

  if (!targetSemesterId) {
    return { data: null }
  }

  const homeroom = await prisma.homeroomAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      semesterId: targetSemesterId
    },
    include: {
      classroom: true,
      semester: {
        include: { academicYear: true }
      }
    }
  })

  return {
    data: homeroom || null
  }
})
