import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'
import type { UserSchema } from '~~/shared/schemas/user'
import { userSchema } from '~~/shared/schemas/user'

export default defineEventHandler(async (event) => {
  try {
    const body
      = await readValidatedBody(
        event,
        userSchema.parse
      )
    await readBody<UserSchema>(event)
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }

    const password = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({
      data: {
        username: body.username,
        fullname: body.fullname,
        email: body.email || '',
        password: password,
        role: body.role,
        isActive: body.isActive
      },
      select: {
        username: true,
        fullname: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    return {
      success: true,
      message: 'Role berhasil diperbarui.',
      data: user
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }
})
