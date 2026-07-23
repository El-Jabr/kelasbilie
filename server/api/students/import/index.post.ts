import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/db'
import { requireRole } from '../../../utils/auth'

interface StudentImportRow {
  fullname: string
  username: string
  email?: string
  nis: string
  password?: string
}

function generateRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = await readBody<{ rows: StudentImportRow[] }>(event)
  if (!body.rows?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada data yang akan diimport.' })
  }

  const result: {
    username: string
    nis: string
    status: 'success' | 'failed'
    initialPassword?: string
    message?: string
  }[] = []

  for (const row of body.rows) {
    const fullname = row.fullname?.trim()
    const username = row.username?.trim()
    const nis = row.nis?.trim()
    const email = row.email?.trim() || `${username}@student.kelasbilie.sch.id`
    const rawPassword = row.password?.trim() || generateRandomPassword()

    if (!fullname || !username || !nis) {
      result.push({
        username: username || '-',
        nis: nis || '-',
        status: 'failed',
        message: 'Fullname, Username, dan NIS wajib diisi.'
      })
      continue
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Cek user terdaftar berdasarkan username
        let user = await tx.user.findFirst({
          where: {
            OR: [
              { username },
              { email }
            ]
          }
        })

        if (!user) {
          const hashedPassword = await bcrypt.hash(rawPassword, 10)
          user = await tx.user.create({
            data: {
              fullname,
              username,
              email,
              password: hashedPassword,
              role: 'STUDENT',
              isActive: true
            }
          })
        }

        // Cek apakah data Student sudah ada untuk user ini atau NIS ini
        const existingStudent = await tx.student.findFirst({
          where: {
            OR: [
              { userId: user.id },
              { nis }
            ]
          }
        })

        if (existingStudent) {
          throw new Error('Siswa dengan NIS atau User tersebut sudah terdaftar.')
        }

        await tx.student.create({
          data: {
            userId: user.id,
            nis
          }
        })
      })

      result.push({
        username,
        nis,
        status: 'success',
        initialPassword: rawPassword
      })
    } catch (error: any) {
      result.push({
        username,
        nis,
        status: 'failed',
        message: error?.code === 'P2002' ? 'NIS, Username, atau Email sudah digunakan.' : error instanceof Error ? error.message : 'Gagal diimport'
      })
    }
  }

  return {
    summary: {
      total: body.rows.length,
      success: result.filter(item => item.status === 'success').length,
      failed: result.filter(item => item.status === 'failed').length
    },
    result
  }
})
