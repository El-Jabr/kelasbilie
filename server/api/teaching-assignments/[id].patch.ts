import { prisma } from '../../utils/db'
import { updateTeachingAssignmentSchema } from '~~/shared/schemas/teaching-assignment'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID penugasan mengajar tidak ditemukan.' })

    const body = await readValidatedBody(event, updateTeachingAssignmentSchema.parse)

    const teaching = await prisma.teachingAssignment.update({
      where: { id },
      data: {
        ...(body.teacherId !== undefined && { teacherId: body.teacherId }),
        ...(body.subjectId !== undefined && { subjectId: body.subjectId }),
        ...(body.classroomId !== undefined && { classroomId: body.classroomId }),
        ...(body.semesterId !== undefined && { semesterId: body.semesterId }),
        ...(body.courseId !== undefined && { courseId: body.courseId })
      },
      select: {
        id: true,
        teacherId: true,
        subjectId: true,
        classroomId: true,
        semesterId: true,
        courseId: true,
        teacher: {
          select: {
            id: true,
            nip: true,
            user: { select: { id: true, username: true, fullname: true } }
          }
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        classroom: {
          select: {
            id: true,
            name: true,
            level: true,
            room: true,
            building: true,
            floor: true
          }
        },
        semester: {
          select: {
            id: true,
            type: true,
            isActive: true,
            academicYear: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        course: {
          select: {
            id: true,
            fullname: true,
            shortname: true
          }
        }
      }
    })

    return { success: true, message: 'Penugasan mengajar berhasil diperbarui.', data: teaching }
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan.' })
    }
    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Penugasan mengajar untuk kombinasi guru, mata pelajaran, kelas, dan semester ini atau Course ID tersebut sudah ada.' })
    }
    if ((error as { code?: string })?.code === 'P2003') {
      throw createError({ statusCode: 400, statusMessage: 'Data relasi (Guru, Mata Pelajaran, Kelas, Semester, atau Course) tidak ditemukan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Gagal memperbarui penugasan mengajar.' })
  }
})
