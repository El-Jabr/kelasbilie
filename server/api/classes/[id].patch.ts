import { prisma } from '../../utils/db'
import { updateClassSchema } from '~~/shared/schemas/class'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID kelas tidak ditemukan.'
      })
    }

    const body = await readValidatedBody(
      event,
      updateClassSchema.parse
    )

    const classroom = await prisma.classroom.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.building !== undefined && { building: body.building }),
        ...(body.room !== undefined && { room: body.room }),
        ...(body.floor !== undefined && { floor: body.floor })
      },
      select: {
        id: true,
        name: true,
        level: true,
        room: true,
        building: true,
        floor: true
      }
    })

    return {
      success: true,
      message: 'Kelas berhasil diperbarui.',
      data: classroom
    }
  } catch (error: any) {
    console.error('Error updating class:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kelas tidak ditemukan.'
      })
    }

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Nama dan level kelas sudah terdaftar.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal memperbarui kelas.'
    })
  }
})
