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

  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      nis: true,
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
      classes: {
        select: {
          id: true,
          classroomId: true,
          semesterId: true,
          classroom: {
            select: {
              id: true,
              name: true,
              level: true,
              room: true,
              building: true,
              floor: true,
              homerooms: {
                select: {
                  id: true,
                  semesterId: true,
                  teacher: {
                    select: {
                      id: true,
                      nip: true,
                      user: {
                        select: {
                          fullname: true,
                          email: true
                        }
                      }
                    }
                  },
                  semester: {
                    select: {
                      id: true,
                      isActive: true
                    }
                  }
                }
              }
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
                  name: true,
                  isActive: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!student) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data profil siswa tidak ditemukan.'
    })
  }

  return {
    success: true,
    data: student
  }
})
