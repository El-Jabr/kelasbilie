import * as XLSX from 'xlsx'
import { prisma } from '../../utils/db'

const VALID_ROLES = ['ADMIN', 'STUDENT', 'TEACHER']

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)

  if (!files) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File tidak ditemukan'
    })
  }

  const file = files.find((f) => f.name === 'file')

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File tidak ditemukan'
    })
  }

  const workbook = XLSX.read(file.data)

  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet tidak ditemukan'
    })
  }

  const sheet = workbook.Sheets[sheetName]

  if (!sheet) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet tidak ditemukan'
    })
  }

  const excelRows = XLSX.utils.sheet_to_json<any>(sheet, {
    defval: ''
  })

  const usernameSet = new Set<string>()
  const emailSet = new Set<string>()

  const usernames = excelRows
    .map(r => String(r.username || '').trim())
    .filter(Boolean)

  const emails = excelRows
    .map(r => String(r.email || '').trim())
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

    const row = excelRows[i]

    const username = String(row.username).trim()
    const fullname = String(row.fullname).trim()
    const email = String(row.email).trim()
    const password = String(row.password)
    const role = String(row.role).trim().toUpperCase()

    const errors: string[] = []

    if (!username)
      errors.push("Username wajib diisi")

    if (!fullname)
      errors.push("Fullname wajib diisi")

    if (!password)
      errors.push("Password wajib diisi")

    if (password && password.length < 6)
      errors.push("Password minimal 6 karakter")

    if (!role)
      errors.push("Role wajib diisi")

    if (role && !VALID_ROLES.includes(role))
      errors.push("Role tidak valid")

    if (email) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email))
        errors.push("Format email tidak valid")
    }

    if (usernameSet.has(username))
      errors.push("Username duplikat pada file")

    if (email && emailSet.has(email))
      errors.push("Email duplikat pada file")

    if (dbUsername.has(username))
      errors.push("Username sudah ada")

    if (email && dbEmail.has(email))
      errors.push("Email sudah ada")

    usernameSet.add(username)

    if (email)
      emailSet.add(email)

    const status = errors.length === 0 ? "valid" : "invalid"

    if (status === "valid")
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
      status,
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
