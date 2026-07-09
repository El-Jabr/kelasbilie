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
  const body = await readBody<ImportBody>(event)

  if (!body.rows?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak ada data yang akan diimport'
    })
  }

  const result: ImportResultRow[] = []
  const usersToCreate = []

  // Ambil seluruh username & email yang akan dicek
  const usernames = body.rows.map(r => r.username.trim())
  const emails = body.rows
    .map(r => r.email?.trim())
    .filter(Boolean) as string[]

  // Cek user yang sudah ada hanya sekali
  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        {
          username: {
            in: usernames
          }
        },
        {
          email: {
            in: emails
          }
        }
      ]
    },
    select: {
      username: true,
      email: true
    }
  })

  const existingUsername = new Set(
    existingUsers.map(u => u.username)
  )

  const existingEmail = new Set(
    existingUsers
      .map(u => u.email)
      .filter(Boolean)
  )

  // Untuk mencegah duplikat di dalam file import
  const importedUsername = new Set<string>()
  const importedEmail = new Set<string>()

  for (const row of body.rows) {
    const username = row.username.trim()
    const fullname = row.fullname.trim()
    const email = row.email?.trim() || null

    if (existingUsername.has(username)) {
      result.push({
        username,
        status: 'failed',
        message: 'Username sudah digunakan'
      })
      continue
    }

    if (email && existingEmail.has(email)) {
      result.push({
        username,
        status: 'failed',
        message: 'Email sudah digunakan'
      })
      continue
    }

    if (importedUsername.has(username)) {
      result.push({
        username,
        status: 'failed',
        message: 'Username duplikat di file import'
      })
      continue
    }

    if (email && importedEmail.has(email)) {
      result.push({
        username,
        status: 'failed',
        message: 'Email duplikat di file import'
      })
      continue
    }

    importedUsername.add(username)

    if (email) {
      importedEmail.add(email)
    }

    usersToCreate.push({
      username,
      fullname,
      email,
      password: await bcrypt.hash(row.password, 10),
      role: row.role,
      isActive: true
    })

    result.push({
      username,
      status: 'success'
    })
  }

  let created = 0

  if (usersToCreate.length) {
    const response = await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true
    })

    created = response.count
  }

  return {
    summary: {
      total: body.rows.length,
      success: created,
      failed: body.rows.length - created
    },
    result
  }
})
