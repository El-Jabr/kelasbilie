import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const nip = String(body.nip || '').trim()
    const userId = body.userId ? String(body.userId).trim() : ''

    if (!nip) {
      throw createError({ statusCode: 400, statusMessage: 'NIP wajib diisi.' })
    }

    let targetUserId = userId

    if (!targetUserId) {
      // Create new user on the fly
      const fullname = String(body.fullname || '').trim()
      const username = String(body.username || nip).trim()
      const email = String(body.email || `${username}@teacher.kelasbilie.sch.id`).trim()
      const password = String(body.password || `Bilie#${nip}`).trim()
      const userRole = String(body.role || 'TEACHER').trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'TEACHER'

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
          role: userRole,
          isActive: true
        }
      })

      targetUserId = newUser.id
    }

    const teacher = await prisma.teacher.create({
      data: { userId: targetUserId, nip },
      select: {
        id: true,
        userId: true,
        nip: true,
        user: { select: { id: true, username: true, fullname: true } }
      }
    })

    return { success: true, message: 'Guru berhasil ditambahkan.', data: teacher }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'NIP, Username, atau Email sudah digunakan.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to create teacher: ' + error.message })
  }
})
