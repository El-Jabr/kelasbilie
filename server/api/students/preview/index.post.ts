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

  const nisSet = new Set<string>()
  const usernameSet = new Set<string>()
  const emailSet = new Set<string>()

  const nises = excelRows.map((r: any) => String(r.nis ?? '').trim()).filter(Boolean)
  const usernames = excelRows.map((r: any) => String(r.username ?? r.nis ?? '').trim()).filter(Boolean)
  const emails = excelRows.map((r: any) => String(r.email ?? '').trim()).filter(Boolean)

  const [existingStudents, existingUsers] = await Promise.all([
    prisma.student.findMany({
      where: { nis: { in: nises } },
      select: { nis: true }
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

  const dbNis = new Set(existingStudents.map(s => s.nis))
  const dbUsername = new Set(existingUsers.map(u => u.username))
  const dbEmail = new Set(existingUsers.map(u => u.email).filter(Boolean))

  const rows = []
  let valid = 0
  let invalid = 0

  for (let i = 0; i < excelRows.length; i++) {
    const row: any = excelRows[i]

    const nis = String(row.nis ?? '').trim()
    const username = String(row.username ?? nis).trim()
    const fullname = String(row.fullname ?? username).trim()
    const email = String(row.email ?? '').trim()
    const password = String(row.password ?? '')
    const moodleUserIdRaw = row.moodleUserId ? Number(row.moodleUserId) : null

    const errors: string[] = []

    if (!nis) errors.push('NIS wajib diisi')
    if (!username) errors.push('Username wajib diisi')
    if (!fullname) errors.push('Fullname / Nama Siswa wajib diisi')

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) errors.push('Format email tidak valid')
    }

    if (nis && nisSet.has(nis)) errors.push('NIS duplikat pada file')
    if (username && usernameSet.has(username)) errors.push('Username duplikat pada file')
    if (email && emailSet.has(email)) errors.push('Email duplikat pada file')

    if (nis && dbNis.has(nis)) errors.push('NIS sudah terdaftar')
    if (username && dbUsername.has(username)) errors.push('Username sudah digunakan')
    if (email && dbEmail.has(email)) errors.push('Email sudah digunakan')

    if (nis) nisSet.add(nis)
    if (username) usernameSet.add(username)
    if (email) emailSet.add(email)

    const isValid = errors.length === 0
    if (isValid) valid++
    else invalid++

    rows.push({
      row: i + 2,
      nis,
      username,
      fullname,
      email,
      password,
      moodleUserId: moodleUserIdRaw,
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
