import { prisma } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    const users = await prisma.user.findMany({
    })
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch users'
    })
  }
})
