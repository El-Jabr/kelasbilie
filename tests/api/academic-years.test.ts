import { describe, it, expect, vi } from 'vitest'
import listHandler from '~/server/api/academic-years/index.get'
import createHandler from '~/server/api/academic-years/index.post'
import updateHandler from '~/server/api/academic-years/[id]/index.put'
import deleteHandler from '~/server/api/academic-years/[id]/index.delete'
import statusHandler from '~/server/api/academic-years/[id]/status.patch'
import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    academicYear: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(prisma)
      }
      return Promise.all(arg)
    })
  }
}))

describe('Academic Years API Unit Tests', () => {
  describe('GET /api/academic-years', () => {
    it('should return paginated academic years list', async () => {
      const mockList = [
        { id: 'ay-1', name: '2024/2025', isActive: true, isLocked: false }
      ]
      vi.mocked(prisma.academicYear.count).mockResolvedValue(1)
      vi.mocked(prisma.academicYear.findMany).mockResolvedValue(mockList as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listHandler(event)

      expect(res.data).toEqual(mockList)
      expect(res.pagination.total).toBe(1)
    })
  })

  describe('POST /api/academic-years', () => {
    it('should create new academic year', async () => {
      const mockCreated = { id: 'ay-2', name: '2025/2026', isActive: true, isLocked: false }
      vi.mocked(prisma.academicYear.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.academicYear.create).mockResolvedValue(mockCreated as any)

      const event = createMockEvent({
        method: 'POST',
        body: { id: 'ay-2', name: '2025/2026', createdAt: '2025-01-01', isActive: true, isLocked: false }
      })

      const res = await createHandler(event)
      expect(res.success).toBe(true)
      expect(res.data.name).toBe('2025/2026')
    })
  })

  describe('PUT /api/academic-years/[id]', () => {
    it('should update academic year', async () => {
      const mockUpdated = { id: 'ay-1', name: '2024/2025 (Revisi)', isActive: false }
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({ id: 'ay-1' } as any)
      vi.mocked(prisma.academicYear.update).mockResolvedValue(mockUpdated as any)

      const event = createMockEvent({
        method: 'PUT',
        params: { id: 'ay-1' },
        body: { id: 'ay-1', name: '2024/2025', createdAt: '2024-01-01', isActive: false, isLocked: false }
      })

      const res = await updateHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('DELETE /api/academic-years/[id]', () => {
    it('should delete academic year', async () => {
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({ id: 'ay-1', isLocked: false } as any)
      vi.mocked(prisma.academicYear.delete).mockResolvedValue({ id: 'ay-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 'ay-1' }
      })

      const res = await deleteHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('PATCH /api/academic-years/[id]/status', () => {
    it('should toggle active status', async () => {
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({ id: 'ay-1', isActive: false, isLocked: false } as any)
      vi.mocked(prisma.academicYear.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.academicYear.update).mockResolvedValue({ id: 'ay-1', isActive: true } as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: 'ay-1' },
        body: { isActive: true }
      })

      const res = await statusHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
