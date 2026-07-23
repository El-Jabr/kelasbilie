import { prisma } from '../../utils/db'
import { createClassSchema } from '~~/shared/schemas/class'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      createClassSchema.parse
    )

    const classroom = await prisma.classroom.create({
      data: {
        name: body.name.trim(),
        level: body.level,
        building: body.building,
        room: body.room,
        floor: body.floor
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
      message: 'Kelas berhasil ditambahkan.',
      data: classroom
    }
  } catch (error: any) {
    console.error('Error creating class:', error)

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
      statusMessage: 'Gagal menambahkan kelas.'
    })
  }
})
