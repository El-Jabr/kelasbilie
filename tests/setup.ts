import { beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { H3Event } from 'h3'

process.env.JWT_SECRET = 'test-jwt-secret-key-123'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'

// Global Nuxt/H3 auto-imports stubs
;(globalThis as any).defineEventHandler = (handler: any) => handler

;(globalThis as any).readBody = async (event: any) => {
  return event._body || {}
}

;(globalThis as any).readValidatedBody = async (event: any, validator: (data: any) => any) => {
  const body = event._body || {}
  if (typeof validator === 'function') {
    return validator(body)
  }
  return body
}

;(globalThis as any).getQuery = (event: any) => {
  return event._query || {}
}

;(globalThis as any).getCookie = (event: any, name: string) => {
  return event._cookies?.[name]
}

;(globalThis as any).setCookie = (event: any, name: string, value: string, opts?: any) => {
  if (!event._cookies) event._cookies = {}
  event._cookies[name] = value
}

;(globalThis as any).deleteCookie = (event: any, name: string, opts?: any) => {
  if (event._cookies) delete event._cookies[name]
}

;(globalThis as any).getHeader = (event: any, name: string) => {
  return event.node?.req?.headers?.[name.toLowerCase()]
}

;(globalThis as any).getRouterParam = (event: any, name: string) => {
  return event.context?.params?.[name]
}

;(globalThis as any).getRouterParams = (event: any) => {
  return event.context?.params || {}
}

;(globalThis as any).getUserFromEvent = (event: any) => {
  const token = event._cookies?.['token']
  if (!token) {
    throw (globalThis as any).createError({ statusCode: 401, message: 'Tidak terautentikasi.' })
  }
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-123'
  try {
    return (jwt as any).verify(token, secret)
  } catch {
    throw (globalThis as any).createError({ statusCode: 401, message: 'Token tidak valid.' })
  }
}

;(globalThis as any).requireRole = (event: any, allowedRoles: string[]) => {
  const user: any = (globalThis as any).getUserFromEvent(event)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw (globalThis as any).createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}

;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string; message?: string; data?: any }) => {
  const err: any = new Error(opts.message || opts.statusMessage || 'H3 Error')
  err.statusCode = opts.statusCode || 500
  err.statusMessage = opts.statusMessage || opts.message
  err.data = opts.data
  return err
}

;(globalThis as any).useRuntimeConfig = () => {
  return {
    jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret-key-123'
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})
