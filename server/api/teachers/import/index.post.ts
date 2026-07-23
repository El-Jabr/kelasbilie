import bcrypt from 'bcryptjs'
import { prisma } from '../../../utils/db'
import { requireRole } from '../../../utils/auth'

interface TeacherImportRow {
  fullname: string
  username: string
  email?: string
  nip: string
  password?: string
  role?: 'TEACHER' | 'ADMIN'
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

  const body = await readBody<{ rows: TeacherImportRow[] }>(event)
  if (!body.rows?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada data yang akan diimport.' })
  }

  const result: {
    username: string
    nip: string
    status: 'success' | 'failed'
    initialPassword?: string
    message?: string
  }[] = []

  for (const row of body.rows) {
    const fullname = row.fullname?.trim()
    const username = row.username?.trim()
    const nip = row.nip?.trim()
    const email = row.email?.trim() || `${username}@teacher.kelasbilie.sch.id`
    const rawPassword = row.password?.trim() || generateRandomPassword()
    const userRole = row.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TEACHER'

    if (!fullname || !username || !nip) {
      result.push({
        username: username || '-',
        nip: nip || '-',
        status: 'failed',
        message: 'Fullname, Username, dan NIP wajib diisi.'
      })
      continue
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Cek user terdaftar berdasarkan username atau email
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
              role: userRole,
              isActive: true
            }
          })
        }

        // Cek apakah data Teacher sudah ada
        const existingTeacher = await tx.teacher.findFirst({
          where: {
            OR: [
              { userId: user.id },
              { nip }
            ]
          }
        })

        if (existingTeacher) {
          throw new Error('Guru dengan NIP atau User tersebut sudah terdaftar.')
        }

        await tx.teacher.create({
          data: {
            userId: user.id,
            nip
          }
        })
      })

      result.push({
        username,
        nip,
        status: 'success',
        initialPassword: rawPassword
      })
    } catch (error: any) {
      result.push({
        username,
        nip,
        status: 'failed',
        message: error?.code === 'P2002' ? 'NIP, Username, atau Email sudah digunakan.' : error instanceof Error ? error.message : 'Gagal diimport'
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
