import type { H3Event } from 'h3'
import jwt from 'jsonwebtoken'

export interface MockUserOptions {
  id?: string
  role?: string
  fullname?: string
  email?: string
}

export function createMockJwtToken(user: MockUserOptions = {}): string {
  const payload = {
    id: user.id || 'test-user-id-123',
    role: user.role || 'SUPER_ADMIN',
    fullname: user.fullname || 'Test Admin',
    email: user.email || 'admin@test.id'
  }
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-123'
  return jwt.sign(payload, secret)
}

export function createMockEvent(options: {
  method?: string
  body?: any
  query?: Record<string, any>
  cookies?: Record<string, string>
  user?: MockUserOptions | false
  headers?: Record<string, string>
  params?: Record<string, string>
} = {}): H3Event {
  const method = options.method || 'GET'
  const body = options.body || {}
  const query = options.query || {}
  const cookies = { ...(options.cookies || {}) }

  if (options.user !== false) {
    cookies['token'] = createMockJwtToken(options.user || {})
  }

  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers || {})
  }

  const mockNodeReq: any = {
    method,
    headers: reqHeaders,
    url: '/api/test'
  }

  const mockNodeRes: any = {
    statusCode: 200,
    headers: {},
    setHeader(name: string, val: string) {
      this.headers[name] = val
    },
    getHeader(name: string) {
      return this.headers[name]
    }
  }

  const context: any = {
    params: options.params || {}
  }

  const event: any = {
    node: {
      req: mockNodeReq,
      res: mockNodeRes
    },
    context,
    _body: body,
    _query: query,
    _cookies: cookies
  }

  return event as H3Event
}
