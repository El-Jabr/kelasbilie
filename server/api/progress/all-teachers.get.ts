import { prisma as db } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const activeSemester = await db.semester.findFirst({
    where: { isActive: true }
  })

  if (!activeSemester) {
    return []
  }

  const teachers = await db.teacher.findMany({
    include: {
      user: true,
      teachings: {
        where: { semesterId: activeSemester.id },
        include: {
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
      }
    }
  })

  const progressList = []

  // 1. Collect all necessary studentIds and gradeItemIds to avoid N+1 queries
  const allStudentIds = new Set<string>()
  const allGradeItemIds = new Set<number>()

  for (const t of teachers) {
    for (const teaching of t.teachings) {
      teaching.classroom.students.forEach((s: any) => allStudentIds.add(s.studentId))
      teaching.course?.gradeItems?.forEach((g: any) => allGradeItemIds.add(g.id))
    }
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
  for (const t of teachers) {
    let totalExpected = 0
    let totalFilled = 0

    for (const teaching of t.teachings) {
      const studentIds = teaching.classroom.students.map((s: { studentId: string }) => s.studentId)
      const gradeItemIds = teaching.course?.gradeItems?.map((g: { id: number }) => g.id) || []

      const expected = studentIds.length * gradeItemIds.length

      if (expected > 0) {
        let filled = 0
        for (const sId of studentIds) {
          for (const gId of gradeItemIds) {
            if (filledSet.has(`${sId}_${gId}`)) {
              filled++
            }
          }
        }
        totalExpected += expected
        totalFilled += filled
      }
    }

    // if a teacher has no teachings or no grade items/students, we say 100%
    const percent = totalExpected === 0 ? 100 : Math.round((totalFilled / totalExpected) * 100)

    progressList.push({
      teacherId: t.id,
      name: t.user.fullname,
      nip: t.nip,
      totalExpected,
      totalFilled,
      percent
    })
  }

  progressList.sort((a, b) => a.percent - b.percent)

  return progressList
})
