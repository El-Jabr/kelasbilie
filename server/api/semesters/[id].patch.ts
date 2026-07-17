import { prisma } from '../../utils/db'
import { updateSemesterSchema } from '~~/shared/schemas/semester'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const body = await readValidatedBody(
      event,
      updateSemesterSchema.parse
    )

    const semester = await prisma.$transaction(async (tx) => {
      const exists = await tx.semester.findUnique({
        where: { id }
      })

      if (!exists) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Semester tidak ditemukan.'
        })
      }

      if (body.isActive === true) {
        await tx.semester.updateMany({
          where: {
            isActive: true,
            NOT: {
              id
            }
          },
          data: {
            isActive: false
          }
        })
      }

      return tx.semester.update({
        where: { id },

        data: body,

        select: {
          id: true,
          type: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,

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
      message: 'Semester berhasil diperbarui.',
      data: semester
    }
  } catch (error) {
    console.error('Error updating semester:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update semester.'
    })
  }
})
