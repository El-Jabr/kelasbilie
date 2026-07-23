import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface JwtPayload {
  id: string
  role: string
  fullname: string
  email: string
}

/**
 * Mengambil dan memverifikasi JWT token dari cookie event.
 * Throws 401 jika tidak ada token / token invalid.
 */
export function getUserFromEvent(event: H3Event): JwtPayload {
  const token = getCookie(event, 'token')
  const config = useRuntimeConfig()

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Tidak terautentikasi. Silakan login terlebih dahulu.'
    })
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
    return payload
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token tidak valid atau sudah expired.'
    })
  }
}

/**
 * Memastikan user yang mengirim request memiliki salah satu role yang diizinkan.
 * Throws 403 jika role tidak sesuai.
 */
export function requireRole(event: H3Event, allowedRoles: string[]) {
  const user = getUserFromEvent(event)
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Anda tidak memiliki hak akses.'
    })
  }
  return user
}
