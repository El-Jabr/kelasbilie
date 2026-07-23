import { prisma } from '../../utils/db'
import { createHomeroomAssignmentSchema } from '~~/shared/schemas/homeroom-assignment'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, createHomeroomAssignmentSchema.parse)

    const homeroom = await prisma.homeroomAssignment.create({
      data: {
        teacherId: body.teacherId,
        classroomId: body.classroomId,
        semesterId: body.semesterId
      },
      select: {
        id: true,
        teacherId: true,
        classroomId: true,
        semesterId: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: { select: { id: true, username: true, fullname: true } }
          }
        },
        classroom: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        semester: {
          select: {
            id: true,
            type: true,
            isActive: true
          }
        }
      }
    })

    return {
      success: true,
      message: 'Wali kelas berhasil ditugaskan.',
      data: homeroom
    }
  } catch (error: any) {
    console.error('Error creating homeroom assignment:', error)

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Kelas ini sudah memiliki wali kelas pada semester tersebut, atau guru ini sudah menjadi wali kelas di kelas lain.'
      })
    }

    if (error?.code === 'P2003') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data relasi (Guru, Kelas, atau Semester) tidak ditemukan.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menugaskan wali kelas.'
    })
  }
})
