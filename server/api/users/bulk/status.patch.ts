import { prisma } from '../../../utils/db'

interface Body {
  ids: string[]
  isActive: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (!body.ids?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak ada user yang dipilih.'
    })
  }

  const result = await prisma.user.updateMany({
    where: {
      id: {
        in: body.ids
      }
    },
    data: {
      isActive: body.isActive
    }
  })

  return {
    status: true,
    message: `${result.count} user berhasil ${
      body.isActive ? 'diaktifkan' : 'dinonaktifkan'
    }.`,
    data: {
      total: body.ids.length,
      updated: result.count,
      isActive: body.isActive
    }
  }
})
