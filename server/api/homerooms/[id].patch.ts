import { prisma } from '../../utils/db'
import { updateHomeroomAssignmentSchema } from '~~/shared/schemas/homeroom-assignment'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID Wali Kelas wajib diisi.'
      })
    }

    const body = await readValidatedBody(event, updateHomeroomAssignmentSchema.parse)

    const homeroom = await prisma.homeroomAssignment.update({
      where: { id },
      data: {
        ...(body.teacherId !== undefined && { teacherId: body.teacherId }),
        ...(body.classroomId !== undefined && { classroomId: body.classroomId }),
        ...(body.semesterId !== undefined && { semesterId: body.semesterId })
      },
      select: {
        id: true,
        teacherId: true,
        classroomId: true,
        semesterId: true,
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
      message: 'Penugasan wali kelas berhasil diperbarui.',
      data: homeroom
    }
  } catch (error: any) {
    console.error('Error updating homeroom assignment:', error)

    if (error?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Penugasan wali kelas tidak ditemukan.'
      })
    }

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Kelas ini sudah memiliki wali kelas pada semester tersebut, atau guru ini sudah menjadi wali kelas di kelas lain.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal memperbarui wali kelas.'
    })
  }
})
