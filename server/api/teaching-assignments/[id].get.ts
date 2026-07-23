import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Penugasan Mengajar wajib diisi.'
    })
  }

  const teaching = await prisma.teachingAssignment.findUnique({
    where: { id },
    select: {
      id: true,
      teacherId: true,
      subjectId: true,
      classroomId: true,
      semesterId: true,
      courseId: true,
      teacher: {
        select: {
          id: true,
          nip: true,
          user: { select: { id: true, username: true, fullname: true, email: true } }
        }
      },
      subject: {
        select: {
          id: true,
          code: true,
          name: true
        }
      },
      classroom: {
        select: {
          id: true,
          name: true,
          level: true,
          room: true,
          building: true,
          floor: true
        }
      },
      semester: {
        select: {
          id: true,
          type: true,
          isActive: true,
          academicYear: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      course: {
        select: {
          id: true,
          fullname: true,
          shortname: true,
          moodleCourseId: true,
          gradeItems: {
            select: {
              id: true,
              name: true,
              itemType: true,
              category: true
            }
          }
        }
      }
    }
  })

  if (!teaching) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data penugasan mengajar tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: teaching
  }
})
