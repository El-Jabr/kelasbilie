import { prisma } from '../../utils/db'
import { requireRole, getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['TEACHER', 'ADMIN'])
  const currentUser = getUserFromEvent(event)

  const teacher = await prisma.teacher.findFirst({
    where: { userId: currentUser.id }
  })

  if (!teacher) {
    return { data: null }
  }

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true }
  })

  if (!activeSemester) {
    return { data: null }
  }

  const homeroom = await prisma.homeroomAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      semesterId: activeSemester.id
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
