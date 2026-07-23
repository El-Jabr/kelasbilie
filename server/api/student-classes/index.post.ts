import { prisma } from '../../utils/db'
import { createStudentClassSchema } from '~~/shared/schemas/student-class'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, createStudentClassSchema.parse)

    const studentClass = await prisma.studentClass.create({
      data: {
        studentId: body.studentId,
        classroomId: body.classroomId,
        semesterId: body.semesterId
      },
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        semesterId: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            nis: true,
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
      message: 'Siswa berhasil didaftarkan ke kelas.',
      data: studentClass
    }
  } catch (error: any) {
    console.error('Error creating student class:', error)

    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Siswa ini sudah terdaftar di kelas lain pada semester yang sama.'
      })
    }

    if (error?.code === 'P2003') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data relasi (Siswa, Kelas, atau Semester) tidak ditemukan.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mendaftarkan siswa ke kelas.'
    })
  }
})
