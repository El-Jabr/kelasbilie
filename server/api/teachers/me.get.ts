import jwt from 'jsonwebtoken'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')
  const config = useRuntimeConfig()

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu.'
    })
  }

  let userId: string
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: string }
    userId = payload.id
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token tidak valid.'
    })
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      nip: true,
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          role: true,
          isActive: true
        }
      },
      teachings: {
        orderBy: { id: 'desc' },
        select: {
          id: true,
          teacherId: true,
          subjectId: true,
          classroomId: true,
          semesterId: true,
          courseId: true,
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              kkm: true
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
              shortname: true
            }
          }
        }
      }
    }
  })

  if (!teacher) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data profil guru tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: teacher
  }
})
