import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'
import { userSchema } from '~~/shared/schemas/user'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN'])

  try {
    const body = await readValidatedBody(
      event,
      userSchema.parse
    )

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
        id: true,
        username: true,
        fullname: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })
    return {
      success: true,
      message: 'User berhasil dibuat.',
      data: user
    }
  } catch (error: any) {
    console.error('Error creating user:', error)

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username atau Email sudah terdaftar.'
      })
    }

    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal membuat user.'
    })
  }
})

