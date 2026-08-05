import { logActivity } from '../../utils/logger'
import { getUserFromEvent, type JwtPayload } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  let user: JwtPayload | null = null
  try {
    user = getUserFromEvent(event)
  } catch {
    // Ignore error if token expired or invalid
  }

  if (user) {
    await logActivity({
      event,
      userId: user.id,
      userName: user.fullname,
      category: 'AUTH',
      action: 'LOGOUT',
      description: `User ${user.fullname} (${user.role}) logout`,
      status: 'SUCCESS'
    })
  }

  deleteCookie(event, 'token', { path: '/' })
  return { success: true }
})
