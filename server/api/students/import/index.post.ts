import { prisma } from '../../../utils/db'

interface ImportRow { username: string, nis: string }

export default defineEventHandler(async (event) => {
  const body = await readBody<{ rows: ImportRow[] }>(event)
  if (!body.rows?.length) throw createError({ statusCode: 400, statusMessage: 'Tidak ada data yang akan diimport.' })
  const result: { username: string, status: 'success' | 'failed', message?: string }[] = []
  for (const row of body.rows) {
    try {
      const user = await prisma.user.findUnique({ where: { username: row.username.trim() }, select: { id: true } })
      if (!user) throw new Error('User tidak ditemukan')
      await prisma.student.create({ data: { userId: user.id, nis: row.nis.trim() } })
      result.push({ username: row.username, status: 'success' })
    } catch (error) {
      result.push({ username: row.username, status: 'failed', message: (error as { code?: string })?.code === 'P2002' ? 'NIS atau user sudah digunakan' : error instanceof Error ? error.message : 'Gagal diimport' })
    }
  }
  return { summary: { total: body.rows.length, success: result.filter(item => item.status === 'success').length, failed: result.filter(item => item.status === 'failed').length }, result }
})
