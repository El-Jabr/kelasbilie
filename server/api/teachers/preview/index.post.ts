/* eslint-disable @stylistic/max-statements-per-line */
import { parse } from 'csv-parse/sync'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  const file = files?.find(item => item.name === 'file')
  if (!file?.filename?.toLowerCase().endsWith('.csv')) throw createError({ statusCode: 400, statusMessage: 'File harus berformat CSV.' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: any[] = parse(file.data.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true })
  const usernames = records.map(row => String(row.username ?? '').trim()).filter(Boolean)
  const nips = records.map(row => String(row.nip ?? '').trim()).filter(Boolean)
  const users = await prisma.user.findMany({ where: { username: { in: usernames } }, select: { id: true, username: true, fullname: true, teacher: { select: { id: true } } } })
  const userByUsername = new Map(users.map(user => [user.username, user]))
  const existingNips = new Set((await prisma.teacher.findMany({ where: { nip: { in: nips } }, select: { nip: true } })).map(teacher => teacher.nip))
  const usernameSet = new Set<string>(); const nipSet = new Set<string>()
  const rows = records.map((row, index) => {
    const username = String(row.username ?? '').trim(); const nip = String(row.nip ?? '').trim(); const errors: string[] = []; const user = userByUsername.get(username)
    if (!username) errors.push('Username wajib diisi'); if (!nip) errors.push('NIP wajib diisi')
    if (usernameSet.has(username)) errors.push('Username duplikat pada file'); if (nipSet.has(nip)) errors.push('NIP duplikat pada file')
    if (!user && username) errors.push('User tidak ditemukan'); if (user?.teacher) errors.push('User sudah terhubung ke guru'); if (existingNips.has(nip)) errors.push('NIP sudah digunakan')
    usernameSet.add(username); nipSet.add(nip)
    return { row: index + 2, username, fullname: user?.fullname ?? '', nip, valid: errors.length === 0, errors }
  })
  return { summary: { total: rows.length, valid: rows.filter(row => row.valid).length, invalid: rows.filter(row => !row.valid).length }, rows }
})
