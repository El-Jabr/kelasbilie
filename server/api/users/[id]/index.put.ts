import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/db'
import type { Prisma } from '~~/prisma/generated/client'

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'
interface Body {
  username: string
  fullname: string
  email?: string
  password?: string
  role: Role
  isActive: boolean
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID tidak ditemukan.'
    })
  }

  const body = await readBody<Body>(event)

  // Validasi sederhana
  if (!body.username?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username wajib diisi.'
    })
  }

  if (!body.fullname?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama lengkap wajib diisi.'
    })
  }

  // Cek user
  const currentUser = await prisma.user.findUnique({
    where: {
      id
    }
  })

  if (!currentUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User tidak ditemukan.'
    })
  }

  // Username sudah dipakai user lain?
  const usernameExists = await prisma.user.findFirst({
    where: {
      username: body.username.trim(),
      NOT: {
        id
      }
    }
  })

  if (usernameExists) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username sudah digunakan.'
    })
  }

  // Email sudah dipakai user lain?
  if (body.email?.trim()) {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: body.email.trim(),
        NOT: {
          id
        }
      }
    })

    if (emailExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email sudah digunakan.'
      })
    }
  }

  const data: Prisma.UserUpdateInput = {
    username: body.username.trim(),
    fullname: body.fullname.trim(),
    email: body.email?.trim() || null,
    role: body.role,
    isActive: body.isActive
  }

  // Password hanya diubah jika diisi
  if (body.password?.trim()) {
    data.password = await bcrypt.hash(body.password.trim(), 10)
  }

  const user = await prisma.user.update({
    where: {
      id
    },
    data,
    select: {
      id: true,
      username: true,
      fullname: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  })

  return {
    success: true,
    message: 'User berhasil diperbarui.',
    data: user
  }
})
