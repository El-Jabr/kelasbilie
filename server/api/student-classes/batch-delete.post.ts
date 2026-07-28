import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = await readBody<{
    ids: string[]
  }>(event)

  if (!Array.isArray(body.ids) || !body.ids.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Daftar ID pembagian kelas wajib diisi.'
    })
  }

  const result = await prisma.studentClass.deleteMany({
    where: {
      id: { in: body.ids.map(id => String(id)) }
    }
  })

  return {
    success: true,
    message: `Berhasil menghapus ${result.count} siswa dari kelas.`
  }
})
