import jwt from 'jsonwebtoken'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')
  console.log('Token for API:', token)
  const config = useRuntimeConfig()

  if (!token)
    throw createError({ statusCode: 401, message: 'Not authenticated' })

  const payload = jwt.verify(token, config.jwtSecret) as {
    id: string
    role: string
    fullname: string
  }

  console.log('Payload:', payload)

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, fullname: true }
  })

  if (!user)
    throw createError({ statusCode: 401 })

  return user
})
