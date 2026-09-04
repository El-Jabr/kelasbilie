import { prisma as db } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'STUDENT'])

  const student = await db.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    throw createError({ statusCode: 404, message: 'Data siswa tidak ditemukan' })
  }

  const activeSemester = await db.semester.findFirst({
    where: { isActive: true }
  })

  if (!activeSemester) {
    return { percent: 0, totalExpected: 0, totalFilled: 0, items: [] }
  }

  // Find the student's class for this semester
  const studentClass = await db.studentClass.findFirst({
    where: { studentId: student.id, semesterId: activeSemester.id },
    include: {
      classroom: {
        include: {
          teachings: {
            where: { semesterId: activeSemester.id },
            include: {
              subject: true,
              course: {
                include: {
                  gradeItems: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!studentClass) {
    return { percent: 0, totalExpected: 0, totalFilled: 0, items: [] }
  }

  // 1. Collect all necessary gradeItemIds to avoid N+1 queries
  const allGradeItemIds = new Set<number>()

  for (const teaching of studentClass.classroom.teachings) {
    teaching.course?.gradeItems?.forEach((g: any) => allGradeItemIds.add(g.id))
  }

  // 2. Fetch all matching grade components in a single query
  let filledSet = new Set<number>()
  if (allGradeItemIds.size > 0) {
    const components = await db.gradeComponent.findMany({
      where: {
        studentId: student.id,
        gradeItemId: { in: Array.from(allGradeItemIds) }
      },
      select: { gradeItemId: true }
    })
    filledSet = new Set(components.map(c => c.gradeItemId))
  }

  // 3. Calculate progress in memory
  let totalExpected = 0
  let totalFilled = 0
  const items = []

  for (const teaching of studentClass.classroom.teachings) {
    const gradeItemIds = teaching.course?.gradeItems?.map((g: { id: number }) => g.id) || []
    const expected = gradeItemIds.length
    let filled = 0

    if (expected > 0) {
      for (const gId of gradeItemIds) {
        if (filledSet.has(gId)) {
          filled++
        }
      }
    }

    const percent = expected === 0 ? 100 : Math.round((filled / expected) * 100)

    totalExpected += expected
    totalFilled += filled

    items.push({
      subjectName: teaching.subject.name,
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
