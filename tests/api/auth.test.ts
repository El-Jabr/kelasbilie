import { describe, it, expect, vi } from 'vitest'
import loginHandler from '~/server/api/auth/login.post'
import logoutHandler from '~/server/api/auth/logout.post'
import meHandler from '~/server/api/auth/me.get'
import { createMockEvent, createMockJwtToken } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'
import bcrypt from 'bcryptjs'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

describe('Auth API Unit Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const mockUser = {
        id: 'user-1',
        email: 'test@kelasbilie.id',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        fullname: 'Super Admin Test'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const event = createMockEvent({
        method: 'POST',
        body: { email: 'test@kelasbilie.id', password: 'password123' },
        user: false
      })

      const res = await loginHandler(event)
      expect(res.success).toBe(true)
      expect(res.data.email).toBe('test@kelasbilie.id')
      expect(res.data.role).toBe('SUPER_ADMIN')
    })

    it('should fail when user email is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const event = createMockEvent({
        method: 'POST',
        body: { email: 'notfound@test.id', password: 'password123' },
        user: false
      })

      await expect(loginHandler(event)).rejects.toThrow('Email tidak ditemukan')
    })

    it('should fail when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10)
      const mockUser = {
        id: 'user-1',
        email: 'test@kelasbilie.id',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        fullname: 'Test User'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const event = createMockEvent({
        method: 'POST',
        body: { email: 'test@kelasbilie.id', password: 'wrongpassword' },
        user: false
      })

      await expect(loginHandler(event)).rejects.toThrow('Password salah')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should execute logout and clear token cookie', async () => {
      const event = createMockEvent({ method: 'POST' })
      const res = await logoutHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return payload when token cookie is valid', async () => {
      const event = createMockEvent({
        user: {
          id: 'u-100',
          role: 'TEACHER',
          fullname: 'Teacher John',
          email: 'teacher@test.id'
        }
      })

      const res = await meHandler(event)
      expect(res.id).toBe('u-100')
      expect(res.role).toBe('TEACHER')
      expect(res.fullname).toBe('Teacher John')
    })

    it('should throw 401 when token cookie is missing', async () => {
      const event = createMockEvent({ user: false })
      expect(() => meHandler(event)).toThrow('Tidak terautentikasi')
    })

    it('should throw 401 when token cookie is invalid', async () => {
      const event = createMockEvent({
        cookies: { token: 'invalid-token-string' },
        user: false
      })
      expect(() => meHandler(event)).toThrow('Token tidak valid')
    })
  })
})
