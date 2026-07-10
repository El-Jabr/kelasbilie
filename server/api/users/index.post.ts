import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'

type UserRole = 'ADMIN' | 'STUDENT' | 'TEACHER'
interface user {
  username: string
  fullname: string
  email?: string
  password: string
  role: UserRole
  isActive: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<user>(event)
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
