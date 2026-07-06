import { prisma } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ name: string, email: string }>(event)
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email
      }
    })
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }
})
