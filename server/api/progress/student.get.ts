import db from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'STUDENT') {
    throw createError({ statusCode: 403, message: 'Hanya untuk siswa' })
  }

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

  let totalExpected = 0
  let totalFilled = 0
  const items = []

  for (const teaching of studentClass.classroom.teachings) {
    const gradeItems = teaching.course?.gradeItems || []
    const expected = gradeItems.length
    let filled = 0

    if (expected > 0) {
      const gradeItemIds = gradeItems.map(g => g.id)
      filled = await db.gradeComponent.count({
        where: {
          studentId: student.id,
          gradeItemId: { in: gradeItemIds }
        }
      })
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
