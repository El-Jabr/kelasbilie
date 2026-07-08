import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/db'

type UserRole = 'ADMIN' | 'STUDENT' | 'TEACHER'

interface ImportRow {
  username: string
  fullname: string
  email?: string
  password: string
  role: UserRole
}

interface ImportBody {
  rows: ImportRow[]
}

interface ImportResultRow {
  username: string
  status: 'success' | 'failed'
  message?: string
}

interface ImportSummary {
  total: number
  success: number
  failed: number
}

export default defineEventHandler(async (event): Promise<{
  summary: ImportSummary
  result: ImportResultRow[]
}> => {
  const body = (await readBody(event)) as ImportBody

  const rows = body.rows

  if (!rows || rows.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak ada data yang akan diimport'
    })
  }

  const result: ImportResultRow[] = []

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      try {
        const username = row.username.trim()
        const email = row.email?.trim() || null

        const exists = await tx.user.findFirst({
          where: {
            OR: [
              { username },
              ...(email ? [{ email }] : [])
            ]
          }
        })

        if (exists) {
          result.push({
            username,
            status: 'failed',
            message: 'Username atau email sudah digunakan'
          })
          continue
        }

        const users = await Promise.all(
          rows.map(async row => ({
            username: row.username.trim(),
            fullname: row.fullname.trim(),
            email: row.email?.trim() || null,
            password: await bcrypt.hash(row.password, 10),
            role: row.role,
            isActive: true
          }))
        )

        await prisma.user.createMany({
          data: users,
          skipDuplicates: true
        })

        result.push({
          username,
          status: 'success'
        })
      } catch (error) {
        result.push({
          username: row.username,
          status: 'failed',
          message: error as Error['message']
        })
      }
    }
  })

  return {
    summary: {
      total: rows.length,
      success: result.filter(r => r.status === 'success').length,
      failed: result.filter(r => r.status === 'failed').length
    },
    result
  }
})
