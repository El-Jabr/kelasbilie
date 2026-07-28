import { parse } from 'csv-parse/sync'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  const file = files?.find(item => item.name === 'file')
  if (!file?.filename?.toLowerCase().endsWith('.csv')) {
    throw createError({ statusCode: 400, statusMessage: 'File harus berformat CSV.' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: any[] = parse(file.data.toString('utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })

  const usernames = records.map(row => String(row.username ?? '').trim()).filter(Boolean)
  const nises = records.map(row => String(row.nis ?? '').trim()).filter(Boolean)
  const emails = records.map(row => String(row.email ?? '').trim()).filter(Boolean)

  // Cek user yang sudah terdaftar di database
  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { username: { in: usernames } },
        ...(emails.length ? [{ email: { in: emails } }] : [])
      ]
    },
    select: { id: true, username: true, email: true, student: { select: { id: true } } }
  })
  const userByUsername = new Map(existingUsers.map(u => [u.username, u]))
  const userByEmail = new Map(existingUsers.filter(u => u.email).map(u => [u.email!, u]))

  // Cek NIS yang sudah terdaftar
  const existingStudents = await prisma.student.findMany({
    where: { nis: { in: nises } },
    select: { nis: true }
  })
  const existingNises = new Set(existingStudents.map(s => s.nis))

  const usernameSet = new Set<string>()
  const nisSet = new Set<string>()
  const emailSet = new Set<string>()

  const rows = records.map((row, index) => {
    const fullname = String(row.fullname ?? '').trim()
    const username = String(row.username ?? '').trim()
    const nis = String(row.nis ?? '').trim()
    const email = String(row.email ?? '').trim()
    const password = String(row.password ?? '').trim()
    const moodleUserId = String(row.moodleUserId ?? '').trim()
    const errors: string[] = []

    if (!fullname) errors.push('Fullname wajib diisi')
    if (!username) errors.push('Username wajib diisi')
    if (!nis) errors.push('NIS wajib diisi')

    if (usernameSet.has(username)) errors.push('Username duplikat pada file')
    if (nisSet.has(nis)) errors.push('NIS duplikat pada file')
    if (email && emailSet.has(email)) errors.push('Email duplikat pada file')

    if (username) usernameSet.add(username)
    if (nis) nisSet.add(nis)
    if (email) emailSet.add(email)

    // Cek konflik dengan database
    const existingUser = userByUsername.get(username)
    if (existingUser?.student) {
      errors.push('User/Username sudah terdaftar sebagai siswa')
    }

    if (email) {
      const existingEmailUser = userByEmail.get(email)
      if (existingEmailUser && existingEmailUser.username !== username) {
        errors.push('Email sudah digunakan user lain di database')
      }
    }

    if (existingNises.has(nis)) {
      errors.push('NIS sudah digunakan di database')
    }

    return {
      row: index + 2,
      fullname: fullname || (existingUser?.username ?? ''),
      username,
      nis,
      email: email || undefined,
      password: password || undefined,
      moodleUserId: moodleUserId || undefined,
      valid: errors.length === 0,
      errors
    }
  })

  return {
    summary: {
      total: rows.length,
      valid: rows.filter(row => row.valid).length,
      invalid: rows.filter(row => !row.valid).length
    },
    rows
  }
})
