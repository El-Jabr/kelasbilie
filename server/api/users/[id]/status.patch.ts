import { prisma } from '../../../utils/db'
import type { UserSchema } from '~~/shared/schemas/user'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User tidak ditemukan.'
    })
  }

  const body = await readBody<UserSchema>(event)

  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      fullname: true,
      username: true,
      isActive: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User tidak ditemukan.'
    })
  }

  if (user.isActive === body.isActive) {
    return {
      success: true,
      message: 'Status tidak berubah.',
      data: user
    }
  }

  const updated = await prisma.user.update({
    where: {
      id
    },
    data: {
      isActive: body.isActive
    },
    select: {
      id: true,
      fullname: true,
      username: true,
      isActive: true
    }
  })

  return {
    success: true,
    message: updated.isActive
      ? 'User berhasil diaktifkan.'
      : 'User berhasil dinonaktifkan.',
    data: updated
  }
})
