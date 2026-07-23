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
