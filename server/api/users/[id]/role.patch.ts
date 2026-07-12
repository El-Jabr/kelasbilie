import { prisma } from '../../../utils/db'
import type { UserSchema } from '~~/shared/schemas/user'

const VALID_ROLES = [
  'ADMIN',
  'TEACHER',
  'STUDENT'
] as const

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID tidak ditemukan.'
    })
  }

  const body = await readBody<UserSchema>(event)

  if (!VALID_ROLES.includes(body.role)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Role tidak valid.'
    })
  }

  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      fullname: true,
      role: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User tidak ditemukan.'
    })
  }

  if (user.role === body.role) {
    return {
      success: true,
      message: 'Role tidak berubah.',
      data: user
    }
  }

  const updated = await prisma.user.update({
    where: {
      id
    },
    data: {
      role: body.role
    },
    select: {
      id: true,
      fullname: true,
      role: true
    }
  })

  return {
    success: true,
    message: 'Role berhasil diperbarui.',
    data: updated
  }
})
