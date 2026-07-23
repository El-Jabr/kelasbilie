import { prisma } from '../../utils/db'
import { academicYearSchema } from '~~/shared/schemas/academic-year'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      academicYearSchema.parse
    )

    if (body.isActive) {
      await prisma.academicYear.updateMany({
        data: { isActive: false }
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: body.name.trim(),
        isActive: body.isActive,
        isLocked: body.isLocked
      },

      select: {
        id: true,
        name: true,
        isActive: true,
        isLocked: true,
        createdAt: true
      }
    })

    return {
      success: true,
      message: 'Tahun ajaran berhasil ditambahkan.',
      data: academicYear
    }
  } catch (error: any) {
    console.error('Error creating academic year:', error)

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Nama tahun ajaran sudah ada.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menambahkan tahun ajaran.'
    })
  }
})
