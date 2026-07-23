import { prisma } from '../../utils/db'
import { createSubjectSchema } from '~~/shared/schemas/subject'

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(
      event,
      createSubjectSchema.parse
    )

    const subject = await prisma.subject.create({
      data: {
        code: body.code.trim(),
        name: body.name.trim()
      },
      select: {
        id: true,
        code: true,
        name: true
      }
    })

    return {
      success: true,
      message: 'Mata pelajaran berhasil ditambahkan.',
      data: subject
    }
  } catch (error) {
    console.error('Error creating subject:', error)

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
      statusMessage: 'Failed to create subject.'
    })
  }
})
