import db from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, message: 'Hanya untuk admin' })
  }

  const activeSemester = await db.semester.findFirst({
    where: { isActive: true },
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

  for (const t of teachers) {
    let totalExpected = 0
    let totalFilled = 0
    
    for (const teaching of t.teachings) {
      const studentsCount = teaching.classroom.students.length
      const gradeItems = teaching.course?.gradeItems || []
      const gradeItemsCount = gradeItems.length

      const expected = studentsCount * gradeItemsCount
      
      if (expected > 0) {
        const studentIds = teaching.classroom.students.map(s => s.studentId)
        const gradeItemIds = gradeItems.map(g => g.id)

        if (studentIds.length > 0 && gradeItemIds.length > 0) {
           const filled = await db.gradeComponent.count({
            where: {
              studentId: { in: studentIds },
              gradeItemId: { in: gradeItemIds }
            }
          })
          totalExpected += expected
          totalFilled += filled
        }
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
