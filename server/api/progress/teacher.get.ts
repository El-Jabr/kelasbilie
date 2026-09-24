import { prisma as db } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  // Get active semester
  const activeSemester = await db.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  })

  if (!activeSemester) {
    return { progress: 0, items: [] }
  }

  const teacher = await db.teacher.findUnique({
    where: { userId: user.id }
  })

  if (!teacher) {
    throw createError({ statusCode: 404, message: 'Data guru tidak ditemukan' })
  }

  // Find all teaching assignments for this teacher in the active semester
  const teachings = await db.teachingAssignment.findMany({
    where: {
      teacherId: teacher.id,
      semesterId: activeSemester.id
    },
    include: {
      subject: true,
      classroom: {
        include: {
          students: {
            where: { semesterId: activeSemester.id }
          }
        }
      },
      course: {
        include: {
          gradeItems: true
        }
      }
    }
  })

  // 1. Collect all necessary studentIds and gradeItemIds to avoid N+1 queries
  const allStudentIds = new Set<string>()
  const allGradeItemIds = new Set<number>()

  for (const teaching of teachings) {
    teaching.classroom.students.forEach((s: { studentId: string }) => allStudentIds.add(s.studentId))
    teaching.course?.gradeItems?.forEach((g: { id: number }) => allGradeItemIds.add(g.id))
  }

  // 2. Fetch all matching grade components in a single query
  let filledSet = new Set<string>()
  if (allStudentIds.size > 0 && allGradeItemIds.size > 0) {
    const components = await db.gradeComponent.findMany({
      where: {
        studentId: { in: Array.from(allStudentIds) },
        gradeItemId: { in: Array.from(allGradeItemIds) }
      },
      select: { studentId: true, gradeItemId: true }
    })
    filledSet = new Set(components.map(c => `${c.studentId}_${c.gradeItemId}`))
  }

  // 3. Calculate progress in memory
  let totalExpected = 0
  let totalFilled = 0
  const items = []

  for (const teaching of teachings) {
    const studentIds = teaching.classroom.students.map((s: { studentId: string }) => s.studentId)
    const gradeItemIds = teaching.course?.gradeItems?.map((g: { id: number }) => g.id) || []

    const studentsCount = studentIds.length
    const gradeItemsCount = gradeItemIds.length

    const expected = studentsCount * gradeItemsCount
    let filled = 0

    if (expected > 0) {
      for (const sId of studentIds) {
        for (const gId of gradeItemIds) {
          if (filledSet.has(`${sId}_${gId}`)) {
            filled++
          }
        }
      }
    }

    const percent = expected === 0 ? 100 : Math.round((filled / expected) * 100)

    totalExpected += expected
    totalFilled += filled

    items.push({
      teachingId: teaching.id,
      subjectName: teaching.subject.name,
      className: teaching.classroom.name,
      studentsCount,
      gradeItemsCount,
      expected,
      filled,
      percent
    })
  }

  const overallPercent = totalExpected === 0 ? 100 : Math.round((totalFilled / totalExpected) * 100)

  return {
    overallPercent,
    totalExpected,
    totalFilled,
    items
  }
})
