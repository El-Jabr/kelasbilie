import { prisma as db } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])
  const query = getQuery(event)
  const semesterId = query.semesterId ? String(query.semesterId) : undefined
  
  if (!semesterId) {
    return []
  }

  // Fetch all teaching assignments for the semester
  const teachings = await db.teachingAssignment.findMany({
    where: { semesterId },
    select: {
      id: true,
      classroom: {
        select: {
          students: {
            where: { semesterId },
            select: { studentId: true }
          }
        }
      },
      course: {
        select: {
          gradeItems: {
            select: { id: true }
          }
        }
      }
    }
  })

  // 1. Collect all necessary studentIds and gradeItemIds to avoid N+1 queries
  const allStudentIds = new Set<string>()
  const allGradeItemIds = new Set<number>()

  for (const teaching of teachings) {
    teaching.classroom?.students?.forEach((s: any) => allStudentIds.add(s.studentId))
    teaching.course?.gradeItems?.forEach((g: any) => allGradeItemIds.add(g.id))
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
  const results = []

  for (const teaching of teachings) {
    const studentIds = teaching.classroom?.students?.map((s: { studentId: string }) => s.studentId) || []
    const gradeItemIds = teaching.course?.gradeItems?.map((g: { id: number }) => g.id) || []

    const expected = studentIds.length * gradeItemIds.length
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

    results.push({
      teachingId: teaching.id,
      expected,
      filled,
      percent
    })
  }

  return results
})
