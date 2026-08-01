import { describe, it, expect, vi } from 'vitest'
import listHandler from '~/server/api/semesters/index.get'
import createHandler from '~/server/api/semesters/index.post'
import activeHandler from '~/server/api/semesters/active.get'
import patchHandler from '~/server/api/semesters/[id].patch'
import deleteHandler from '~/server/api/semesters/[id].delete'
import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    semester: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn()
    },
    academicYear: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(prisma)
      }
      return Promise.all(arg)
    })
  }
}))

describe('Semesters API Unit Tests', () => {
  describe('GET /api/semesters', () => {
    it('should list semesters', async () => {
      const mockSemesters = [{ id: '123e4567-e89b-12d3-a456-426614174001', type: 'GANJIL', isActive: true }]
      vi.mocked(prisma.semester.count).mockResolvedValue(1)
      vi.mocked(prisma.semester.findMany).mockResolvedValue(mockSemesters as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listHandler(event)
      expect(res.data).toEqual(mockSemesters)
    })
  })

  describe('GET /api/semesters/active', () => {
    it('should return active semester', async () => {
      const activeSem = { id: '123e4567-e89b-12d3-a456-426614174001', type: 'GANJIL', isActive: true }
      vi.mocked(prisma.semester.findFirst).mockResolvedValue(activeSem as any)

      const event = createMockEvent()
      const res = await activeHandler(event)
      expect(res.data.id).toBe('123e4567-e89b-12d3-a456-426614174001')
    })
  })

  describe('POST /api/semesters', () => {
    it('should create new semester', async () => {
      const validAyId = '123e4567-e89b-12d3-a456-426614174000'
      const newSem = { id: '123e4567-e89b-12d3-a456-426614174001', type: 'GENAP', academicYearId: validAyId, isActive: false }
      
      vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({ id: validAyId } as any)
      vi.mocked(prisma.semester.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.semester.create).mockResolvedValue(newSem as any)

      const event = createMockEvent({
        method: 'POST',
        body: { type: 'GENAP', academicYearId: validAyId, isActive: false }
      })

      const res = await createHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('PATCH /api/semesters/[id]', () => {
    it('should update semester status or fields', async () => {
      const validSemId = '123e4567-e89b-12d3-a456-426614174001'
      const updatedSem = { id: validSemId, isActive: true }
      vi.mocked(prisma.semester.findUnique).mockResolvedValue({ id: validSemId } as any)
      vi.mocked(prisma.semester.update).mockResolvedValue(updatedSem as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: validSemId },
        body: { isActive: true }
      })

      const res = await patchHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('DELETE /api/semesters/[id]', () => {
    it('should delete semester', async () => {
      const validSemId = '123e4567-e89b-12d3-a456-426614174001'
      vi.mocked(prisma.semester.findUnique).mockResolvedValue({
        id: validSemId,
        isLocked: false,
        _count: { studentClasses: 0, teachingAssignments: 0, homeroomAssignments: 0, gradeSummaries: 0 }
      } as any)
      vi.mocked(prisma.semester.delete).mockResolvedValue({ id: validSemId } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: validSemId }
      })

      const res = await deleteHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
