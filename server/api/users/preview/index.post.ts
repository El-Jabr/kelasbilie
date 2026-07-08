import { parse } from 'csv-parse/sync'
import { prisma } from '../../../utils/db'

const VALID_ROLES = ['ADMIN', 'STUDENT', 'TEACHER'] as const

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)

  if (!files) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File tidak ditemukan'
    })
  }

  const file = files.find(f => f.name === 'file')

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File tidak ditemukan'
    })
  }

  if (!file.filename?.toLowerCase().endsWith('.csv')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File harus berformat CSV'
    })
  }
  // Parse CSV
  const excelRows = parse(file.data.toString('utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })

  const usernameSet = new Set<string>()
  const emailSet = new Set<string>()

  const usernames = excelRows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => String(r.username ?? '').trim())
    .filter(Boolean)

  const emails = excelRows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => String(r.email ?? '').trim())
    .filter(Boolean)

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

  const dbUsername = new Set(existingUsers.map(i => i.username))
  const dbEmail = new Set(existingUsers.map(i => i.email).filter(Boolean))

  const rows = []

  let valid = 0
  let invalid = 0

  for (let i = 0; i < excelRows.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = excelRows[i]

    const username = String(row.username ?? '').trim()
    const fullname = String(row.fullname ?? '').trim()
    const email = String(row.email ?? '').trim()
    const password = String(row.password ?? '')
    const role = String(row.role ?? '').trim().toUpperCase()

    const errors: string[] = []

    if (!username)
      errors.push('Username wajib diisi')

    if (!fullname)
      errors.push('Fullname wajib diisi')

    if (!password)
      errors.push('Password wajib diisi')

    if (password.length < 6)
      errors.push('Password minimal 6 karakter')

    if (!role)
      errors.push('Role wajib diisi')

    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number]))
      errors.push('Role tidak valid')

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email))
        errors.push('Format email tidak valid')
    }

    if (usernameSet.has(username))
      errors.push('Username duplikat pada file')

    if (email && emailSet.has(email))
      errors.push('Email duplikat pada file')

    if (dbUsername.has(username))
      errors.push('Username sudah ada')

    if (email && dbEmail.has(email))
      errors.push('Email sudah ada')

    usernameSet.add(username)

    if (email)
      emailSet.add(email)

    const status = errors.length === 0 ? 'valid' : 'invalid'

    if (status === 'valid')
      valid++
    else
      invalid++

    rows.push({
      row: i + 2,
      username,
      fullname,
      email,
      password,
      role,
      valid,
      errors
    })
  }

  return {
    summary: {
      total: excelRows.length,
      valid,
      invalid
    },
    rows
  }
})
