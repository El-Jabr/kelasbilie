import { prisma } from '../../utils/db'
import { createSemesterSchema } from '~~/shared/schemas/semester'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      createSemesterSchema.parse
    )

    const semester = await prisma.$transaction(async (tx) => {
      const academicYear = await tx.academicYear.findUnique({
        where: {
          id: body.academicYearId
        },
        select: {
          id: true
        }
      })

      if (!academicYear) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tahun ajaran tidak ditemukan.'
        })
      }

      const exists = await tx.semester.findUnique({
        where: {
          academicYearId_type: {
            academicYearId: body.academicYearId,
            type: body.type
          }
        }
      })

      if (exists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Semester sudah ada pada tahun ajaran tersebut.'
        })
      }

      if (body.isActive) {
        await tx.semester.updateMany({
          where: {
            isActive: true
          },
          data: {
            isActive: false
          }
        })
      }

      return tx.semester.create({
        data: body,

        select: {
          id: true,
          type: true,
          isActive: true,
          isLocked: true,
          createdAt: true,

          academicYear: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    })

    return {
      success: true,
      message: 'Semester berhasil ditambahkan.',
      data: semester
    }
  } catch (error) {
    console.error('Error creating semester:', error)

    // Biarkan error HTTP yang sudah dibuat tetap diteruskan
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create semester.'
    })
  }
})
