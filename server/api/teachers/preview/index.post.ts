import { parse } from 'csv-parse/sync'
import { prisma } from '../../../utils/db'

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

  // Parse CSV
  let excelRows: any[] = []
  try {
    excelRows = parse(file.data.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Gagal membaca format file CSV: ' + err.message
    })
  }

  const nipSet = new Set<string>()
  const usernameSet = new Set<string>()
  const emailSet = new Set<string>()

  const nips = excelRows.map((r: any) => String(r.nip ?? '').trim()).filter(Boolean)
  const usernames = excelRows.map((r: any) => String(r.username ?? r.nip ?? '').trim()).filter(Boolean)
  const emails = excelRows.map((r: any) => String(r.email ?? '').trim()).filter(Boolean)

  const [existingTeachers, existingUsers] = await Promise.all([
    prisma.teacher.findMany({
      where: { nip: { in: nips } },
      select: { nip: true }
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { username: { in: usernames } },
          { email: { in: emails } }
        ]
      },
      select: { username: true, email: true }
    })
  ])

  const dbNip = new Set(existingTeachers.map(t => t.nip))
  const dbUsername = new Set(existingUsers.map(u => u.username))
  const dbEmail = new Set(existingUsers.map(u => u.email).filter(Boolean))

  const rows = []
  let valid = 0
  let invalid = 0

  for (let i = 0; i < excelRows.length; i++) {
    const row: any = excelRows[i]

    const nip = String(row.nip ?? '').trim()
    const username = String(row.username ?? nip).trim()
    const fullname = String(row.fullname ?? username).trim()
    const email = String(row.email ?? '').trim()
    const password = String(row.password ?? '')
    const role = String(row.role ?? 'TEACHER').trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TEACHER'

    const errors: string[] = []

    if (!nip) errors.push('NIP wajib diisi')
    if (!username) errors.push('Username wajib diisi')
    if (!fullname) errors.push('Fullname / Nama Guru wajib diisi')

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) errors.push('Format email tidak valid')
    }

    if (nip && nipSet.has(nip)) errors.push('NIP duplikat pada file')
    if (username && usernameSet.has(username)) errors.push('Username duplikat pada file')
    if (email && emailSet.has(email)) errors.push('Email duplikat pada file')

    if (nip && dbNip.has(nip)) errors.push('NIP sudah terdaftar')
    if (username && dbUsername.has(username)) errors.push('Username sudah digunakan')
    if (email && dbEmail.has(email)) errors.push('Email sudah digunakan')

    if (nip) nipSet.add(nip)
    if (username) usernameSet.add(username)
    if (email) emailSet.add(email)

    const isValid = errors.length === 0
    if (isValid) valid++
    else invalid++

    rows.push({
      row: i + 2,
      nip,
      username,
      fullname,
      email,
      password,
      role,
      valid: isValid,
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
