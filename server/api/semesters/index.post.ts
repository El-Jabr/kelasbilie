import { prisma } from '../../utils/db'
import { createSemesterSchema } from '~~/shared/schemas/semester'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      createSemesterSchema.parse
    )

    const academicYear = await prisma.academicYear.findUnique({
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

    const exists = await prisma.semester.findUnique({
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
      await prisma.semester.updateMany({
        where: {
          isActive: true
        },
        data: {
          isActive: false
        }
      })
    }

    const semester = await prisma.semester.create({
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
