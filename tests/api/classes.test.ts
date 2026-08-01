import { describe, it, expect, vi } from 'vitest'
import listHandler from '~/server/api/classes/index.get'
import createHandler from '~/server/api/classes/index.post'
import patchHandler from '~/server/api/classes/[id].patch'
import deleteHandler from '~/server/api/classes/[id].delete'
import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    classroom: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    teachingAssignment: {
      findFirst: vi.fn()
    },
    studentClass: {
      findFirst: vi.fn()
    },
    $transaction: vi.fn((promises) => Promise.all(promises))
  }
}))

describe('Classes API Unit Tests', () => {
  describe('GET /api/classes', () => {
    it('should list classrooms', async () => {
      const mockClasses = [{ id: 'cls-1', name: '7A', level: 7 }]
      vi.mocked(prisma.classroom.count).mockResolvedValue(1)
      vi.mocked(prisma.classroom.findMany).mockResolvedValue(mockClasses as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listHandler(event)
      expect(res.data).toEqual(mockClasses)
    })
  })

  describe('POST /api/classes', () => {
    it('should create new classroom', async () => {
      const newClass = { id: 'cls-2', name: '7B', level: 7 }
      vi.mocked(prisma.classroom.create).mockResolvedValue(newClass as any)

      const event = createMockEvent({
        method: 'POST',
        body: { name: '7B', level: 7, room: 'R1', building: 'B1', floor: 1 }
      })

      const res = await createHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('PATCH /api/classes/[id]', () => {
    it('should update classroom', async () => {
      const updatedClass = { id: 'cls-1', name: '7A Reform' }
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({ id: 'cls-1' } as any)
      vi.mocked(prisma.classroom.update).mockResolvedValue(updatedClass as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: 'cls-1' },
        body: { name: '7A Reform' }
      })

      const res = await patchHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('DELETE /api/classes/[id]', () => {
    it('should delete classroom', async () => {
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({ id: 'cls-1', _count: { students: 0, teachings: 0, homerooms: 0 } } as any)
      vi.mocked(prisma.teachingAssignment.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.studentClass.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.classroom.delete).mockResolvedValue({ id: 'cls-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 'cls-1' }
      })

      const res = await deleteHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
