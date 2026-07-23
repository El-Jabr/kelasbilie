import { prisma } from '../../../utils/db'
import type { Prisma } from '~~/prisma/generated/client'
import { academicYearSchema } from '~~/shared/schemas/academic-year'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Tahun Ajaran tidak ditemukan.'
    })
  }

  const body = await readValidatedBody(
    event,
    academicYearSchema.parse
  )

  // Cek data
  const currentAcademicYear = await prisma.academicYear.findUnique({
    where: {
      id
    }
  })

  if (!currentAcademicYear) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tahun ajaran tidak ditemukan.'
    })
  }

  if (currentAcademicYear.isLocked) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Data tahun ajaran terkunci dan tidak bisa diubah/dihapus.'
    })
  }

  // Nama sudah digunakan?
  const nameExists = await prisma.academicYear.findFirst({
    where: {
      name: body.name.trim(),
      NOT: {
        id
      }
    }
  })

  if (nameExists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Nama tahun ajaran sudah terdaftar.'
    })
  }

  if (body.isActive) {
    await prisma.academicYear.updateMany({
      where: {
        NOT: { id }
      },
      data: { isActive: false }
    })
  }

  const data: Prisma.AcademicYearUpdateInput = {
    name: body.name.trim(),
    isActive: body.isActive,
    isLocked: body.isLocked
  }

  const academicYear = await prisma.academicYear.update({
    where: {
      id
    },
    data,
    select: {
      id: true,
      name: true,
      isActive: true,
      isLocked: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return {
    success: true,
    message: 'Tahun ajaran berhasil diperbarui.',
    data: academicYear
  }
})
