import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const nis = String(body.nis || '').trim()
    const userId = body.userId ? String(body.userId).trim() : ''

    if (!nis) {
      throw createError({ statusCode: 400, statusMessage: 'NIS wajib diisi.' })
    }

    let targetUserId = userId

    if (!targetUserId) {
      // Create new user on the fly
      const fullname = String(body.fullname || '').trim()
      const username = String(body.username || nis).trim()
      const email = String(body.email || `${username}@student.kelasbilie.sch.id`).trim()
      const password = String(body.password || `Bilie#${nis}`).trim()

      if (!fullname) {
        throw createError({ statusCode: 400, statusMessage: 'Nama Lengkap wajib diisi.' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await prisma.user.create({
        data: {
          fullname,
          username,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true
        }
      })

      targetUserId = newUser.id
    }

    const student = await prisma.student.create({
      data: { userId: targetUserId, nis },
      select: {
        id: true,
        userId: true,
        nis: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Siswa berhasil ditambahkan.', data: student }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIS, Username, atau Email sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to create student: ' + error.message })
  }
})
