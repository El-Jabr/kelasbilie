import { prisma } from '../../utils/db'
import { updateSubjectSchema } from '~~/shared/schemas/subject'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID mata pelajaran tidak ditemukan.'
      })
    }

    const body = await readValidatedBody(
      event,
      updateSubjectSchema.parse
    )

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code.trim() }),
        ...(body.name !== undefined && { name: body.name.trim() })
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    })

    return {
      success: true,
      message: 'Mata pelajaran berhasil diperbarui.',
      data: subject
    }
  } catch (error) {
    console.error('Error updating subject:', error)

    if ((error as { code?: string })?.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Mata pelajaran tidak ditemukan.'
      })
    }

    if ((error as { code?: string })?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Kode mata pelajaran sudah digunakan.'
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subject.'
    })
  }
})
