import db from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'TEACHER') {
    throw createError({ statusCode: 403, message: 'Hanya untuk guru' })
  }

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

  let totalExpected = 0
  let totalFilled = 0
  const items = []

  for (const teaching of teachings) {
    const studentsCount = teaching.classroom.students.length
    const gradeItems = teaching.course?.gradeItems || []
    const gradeItemsCount = gradeItems.length

    const expected = studentsCount * gradeItemsCount
    let filled = 0

    if (expected > 0) {
      // Find grade components for these students and these grade items
      const studentIds = teaching.classroom.students.map(s => s.studentId)
      const gradeItemIds = gradeItems.map(g => g.id)

      if (studentIds.length > 0 && gradeItemIds.length > 0) {
        filled = await db.gradeComponent.count({
          where: {
            studentId: { in: studentIds },
            gradeItemId: { in: gradeItemIds }
          }
        })
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
