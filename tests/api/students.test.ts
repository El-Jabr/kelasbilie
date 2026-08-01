import { describe, it, expect, vi } from 'vitest'
import listStudentsHandler from '~/server/api/students/index.get'
import createStudentHandler from '~/server/api/students/index.post'
import updateStudentHandler from '~/server/api/students/[id].patch'
import deleteStudentHandler from '~/server/api/students/[id].delete'

import deleteStudentClassHandler from '~/server/api/student-classes/[id].delete'
import batchDeleteStudentClassHandler from '~/server/api/student-classes/batch-delete.post'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    student: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    studentClass: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    user: {
      create: vi.fn(),
      update: vi.fn(),
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

describe('Students & Student-Classes API Unit Tests', () => {
  describe('Students Endpoints', () => {
    it('GET /api/students - list students', async () => {
      const mockStudents = [{ id: 'st-1', nis: '1001', user: { fullname: 'Santri Ahmad' } }]
      vi.mocked(prisma.student.count).mockResolvedValue(1)
      vi.mocked(prisma.student.findMany).mockResolvedValue(mockStudents as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listStudentsHandler(event)
      expect(res.data).toEqual(mockStudents)
    })

    it('POST /api/students - create student', async () => {
      const newUser = { id: 'u-1', fullname: 'Santri Bilal' }
      const newStudent = { id: 'st-2', nis: '1002', userId: 'u-1', user: newUser }
      
      vi.mocked(prisma.user.create).mockResolvedValue(newUser as any)
      vi.mocked(prisma.student.create).mockResolvedValue(newStudent as any)

      const event = createMockEvent({
        method: 'POST',
        body: { nis: '1002', fullname: 'Santri Bilal', email: 'bilal@test.id', password: 'password123' }
      })

      const res = await createStudentHandler(event)
      expect(res.success).toBe(true)
    })

    it('PUT /api/students/[id] - update student', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({ id: 'st-1', userId: 'u-1' } as any)
      vi.mocked(prisma.student.update).mockResolvedValue({ id: 'st-1', nis: '1001-rev' } as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: 'st-1' },
        body: { nis: '1001-rev' }
      })

      const res = await updateStudentHandler(event)
      expect(res.success).toBe(true)
    })

    it('DELETE /api/students/[id] - delete student', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'st-1', userId: 'u-1', _count: { classes: 0, gradeSummaries: 0 }
      } as any)
      vi.mocked(prisma.student.delete).mockResolvedValue({ id: 'st-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 'st-1' }
      })

      const res = await deleteStudentHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('Student-Classes Endpoints', () => {
    it('DELETE /api/student-classes/[id] - remove student from class', async () => {
      vi.mocked(prisma.studentClass.findUnique).mockResolvedValue({ id: 'sc-1' } as any)
      vi.mocked(prisma.studentClass.delete).mockResolvedValue({ id: 'sc-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 'sc-1' }
      })

      const res = await deleteStudentClassHandler(event)
      expect(res.success).toBe(true)
    })

    it('POST /api/student-classes/batch-delete - remove multiple students from class', async () => {
      vi.mocked(prisma.studentClass.deleteMany).mockResolvedValue({ count: 2 })

      const event = createMockEvent({
        method: 'POST',
        body: { ids: ['sc-1', 'sc-2'] }
      })

      const res = await batchDeleteStudentClassHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
