import { prisma } from '../../utils/db'
import { logger, logActivity } from '../../utils/logger'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (!user) {
    logger.warn({ email: body.email }, '[AUTH] Login gagal: Email tidak ditemukan')
    await logActivity({
      event,
      userName: body.email || 'Unknown User',
      category: 'AUTH',
      action: 'LOGIN',
      description: `Login gagal: Email ${body.email} tidak ditemukan`,
      status: 'FAILED',
      errorMessage: 'Email tidak ditemukan'
    })
    throw createError({ statusCode: 401, message: 'Email tidak ditemukan' })
  }

  const valid = await bcrypt.compare(body.password, user.password)
  if (!valid) {
    logger.warn({ email: body.email, userId: user.id }, '[AUTH] Login gagal: Password salah')
    await logActivity({
      event,
      userId: user.id,
      userName: user.fullname,
      category: 'AUTH',
      action: 'LOGIN',
      description: `Login gagal: Password salah`,
      status: 'FAILED',
      errorMessage: 'Password salah'
    })
    throw createError({ statusCode: 401, message: 'Password salah' })
  }

  /**
   * Buat JWT token yang berisi data dasar user.
   * Data ini akan dipakai oleh /api/auth/me TANPA perlu query DB lagi.
   *
   * PENTING: Jangan masukkan data sensitif ke JWT (password, dll).
   * JWT bisa di-decode oleh siapapun yang punya tokennya (walau tidak bisa dipalsukan).
   */
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      fullname: user.fullname,
      email: user.email ?? ''
    },
    config.jwtSecret,
    { expiresIn: '1d' }
  )

  setCookie(event, 'token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  logger.info({ email: user.email, userId: user.id, role: user.role }, `[AUTH] Login berhasil untuk ${user.email}`)

  await logActivity({
    event,
    userId: user.id,
    userName: user.fullname,
    category: 'AUTH',
    action: 'LOGIN',
    description: `User ${user.fullname} berhasil login (${user.role})`,
    status: 'SUCCESS'
  })

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullname: user.fullname
    }
  }
})
