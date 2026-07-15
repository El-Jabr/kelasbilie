import { prisma } from '../../utils/db'
import { academicYearSchema } from '~~/shared/schemas/academic-year'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      academicYearSchema.parse
    )

    const academicYear = await prisma.academicYear.create({
      data: {
        name: body.name,
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
  } catch (error) {
    console.error('Error creating academic year:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create academic year.'
    })
  }
})
