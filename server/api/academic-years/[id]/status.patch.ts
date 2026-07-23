import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tahun ajaran tidak ditemukan.'
    })
  }

  const body = await readBody<{ isActive: boolean }>(event)

  const academicYear = await prisma.academicYear.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      isLocked: true
    }
  })

  if (!academicYear) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tahun ajaran tidak ditemukan.'
    })
  }

  if (academicYear.isLocked) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Data tahun ajaran terkunci dan tidak bisa diubah/dihapus.'
    })
  }

  if (academicYear.isActive === body.isActive) {
    return {
      success: true,
      message: 'Status tidak berubah.',
      data: academicYear
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.isActive) {
      // Nonaktifkan semua tahun ajaran terlebih dahulu
      await tx.academicYear.updateMany({
        data: {
          isActive: false
        }
      })
    }

    return tx.academicYear.update({
      where: {
        id
      },
      data: {
        isActive: body.isActive
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        isLocked: true
      }
    })
  })

  return {
    success: true,
    message: updated.isActive
      ? 'Tahun ajaran berhasil diaktifkan.'
      : 'Tahun ajaran berhasil dinonaktifkan.',
    data: updated
  }
})
