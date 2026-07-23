import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'
import { updateUserSchema } from '~~/shared/schemas/user'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN'])

  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID User wajib diisi.'
      })
    }

    const body = await readValidatedBody(
      event,
      updateUserSchema.parse
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (body.username !== undefined) updateData.username = body.username.trim()
    if (body.fullname !== undefined) updateData.fullname = body.fullname.trim()
    if (body.email !== undefined) updateData.email = body.email ? body.email.trim() : ''
    if (body.role !== undefined) updateData.role = body.role
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.moodleUserId !== undefined) updateData.moodleUserId = body.moodleUserId

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        role: true,
        moodleUserId: true,
        isActive: true,
        updatedAt: true
      }
    })

    return {
      success: true,
      message: 'User berhasil diperbarui.',
      data: user
    }
  } catch (error: any) {
    console.error('Error updating user:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User tidak ditemukan.'
      })
    }

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
      statusMessage: 'Gagal memperbarui user.'
    })
  }
})
