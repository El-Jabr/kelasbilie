import { H3Event, getRequestHeader, getRequestIP } from 'h3'
import { prisma } from './db'

export interface LogActivityParams {
  event?: H3Event
  userId?: string
  userName?: string
  category: 'AUTH' | 'USER' | 'ACADEMIC' | 'COURSE' | 'GRADE' | 'SYSTEM'
  action: string
  description?: string
  status?: 'SUCCESS' | 'FAILED'
  errorMessage?: string
}

export async function logActivity(params: LogActivityParams) {
  try {
    let userId = params.userId
    let userName = params.userName
    let ipAddress: string | undefined = undefined
    let userAgent: string | undefined = undefined

    if (params.event) {
      ipAddress = getRequestIP(params.event, { xForwardedFor: true }) || undefined
      userAgent = getRequestHeader(params.event, 'user-agent') || undefined

      if (!userId && params.event.context.user) {
        userId = params.event.context.user.id
        userName = userName || params.event.context.user.fullname || params.event.context.user.username
      }
    }

    // Fallback if userId provided but no userName
    if (userId && !userName) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullname: true, username: true }
      })
      if (user) {
        userName = user.fullname || user.username
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        userName: userName || null,
        category: params.category,
        action: params.action,
        description: params.description || null,
        status: params.status || 'SUCCESS',
        errorMessage: params.errorMessage || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      }
    })
  } catch (err) {
    console.error('Failed to write activity log:', err)
  }
}

export const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args)
}

