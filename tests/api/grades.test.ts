import { describe, it, expect, vi } from 'vitest'
import summaryHandler from '~/server/api/grades/summary.get'
import componentsGetHandler from '~/server/api/grades/components.get'
import componentsPostHandler from '~/server/api/grades/components.post'
import itemsPostHandler from '~/server/api/grades/items.post'
import calculatePostHandler from '~/server/api/grades/calculate.post'
import inspectionGetHandler from '~/server/api/grades/inspection.get'
import classroomGradesHandler from '~/server/api/grades/classroom/[classroomId].get'
import studentGradesHandler from '~/server/api/grades/student/[studentId].get'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'
import { calculateGradeSummary } from '~/server/utils/grades'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    gradeSummary: { findMany: vi.fn(), upsert: vi.fn() },
    gradeComponent: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
    gradeItem: { findFirst: vi.fn(), create: vi.fn() },
    course: { findUnique: vi.fn() },
    teachingAssignment: { findUnique: vi.fn(), findMany: vi.fn() },
    studentClass: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    student: { findUnique: vi.fn() },
    classroom: { findUnique: vi.fn() },
    semester: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((promises) => Promise.all(promises))
  }
}))

vi.mock('~/server/utils/grades', () => ({
  calculateGradeSummary: vi.fn()
}))

describe('Grades Engine API Unit Tests', () => {
  describe('GET /api/grades/summary', () => {
    it('should return grade summary data', async () => {
      const mockSummaries = [{
        id: 'gs-1',
        score: 85,
        category: 'PH',
        student: { nis: '1001', user: { fullname: 'Ahmad', username: 'ahmad', email: 'ahmad@test.id' } }
      }]
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ id: 'sem-1' } as any)
      vi.mocked(prisma.gradeSummary.findMany).mockResolvedValue(mockSummaries as any)

      const event = createMockEvent({ query: { teachingId: 't-1', semesterId: 'sem-1' } })
      const res = await summaryHandler(event)
      expect(res.data[0].fullname).toBe('Ahmad')
      expect(res.data[0].finalScore).toBe(85)
    })
  })

  describe('GET & POST /api/grades/components', () => {
    it('GET /api/grades/components - list components', async () => {
      const mockComponents = [{ id: 'gc-1', name: 'Tugas Tahfidz', weight: 40 }]
      vi.mocked(prisma.gradeComponent.findMany).mockResolvedValue(mockComponents as any)

      const event = createMockEvent({ query: { studentId: 'st-1', teachingId: 't-1' } })
      const res = await componentsGetHandler(event)
      expect(res.data).toEqual(mockComponents)
    })

    it('POST /api/grades/components - add component', async () => {
      const mockComponent = { id: 'gc-2', score: 90 }
      vi.mocked(prisma.gradeComponent.upsert).mockResolvedValue(mockComponent as any)

      const event = createMockEvent({
        method: 'POST',
        body: { studentId: 'st-1', gradeItemId: 101, score: 90 }
      })

      const res = await componentsPostHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('POST /api/grades/items', () => {
    it('should insert grade item score', async () => {
      vi.mocked(prisma.course.findUnique).mockResolvedValue({ id: 101, fullname: 'IPA 8' } as any)
      vi.mocked(prisma.gradeItem.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.gradeItem.create).mockResolvedValue({ id: -1, name: 'Tugas Harian 1' } as any)

      const event = createMockEvent({
        method: 'POST',
        body: { courseId: 101, name: 'Tugas Harian 1', category: 'PH' }
      })

      const res = await itemsPostHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('POST /api/grades/calculate', () => {
    it('should calculate grade summary correctly', async () => {
      vi.mocked(calculateGradeSummary).mockResolvedValue([{ id: 'gs-1', score: 80 }] as any)

      const event = createMockEvent({
        method: 'POST',
        body: { teachingId: 't-1', semesterId: 'sem-1' }
      })

      const res = await calculatePostHandler(event)
      expect(res.status).toBe('success')
    })
  })

  describe('GET /api/grades/inspection', () => {
    it('should return inspection report for teacher', async () => {
      vi.mocked(prisma.teachingAssignment.findUnique).mockResolvedValue({
        id: 't-1', subject: { name: 'IPA 8' }, classroom: { name: '8A' }
      } as any)
      vi.mocked(prisma.studentClass.findMany).mockResolvedValue([])

      const event = createMockEvent({ query: { teachingId: 't-1', semesterId: 'sem-1' } })
      const res = await inspectionGetHandler(event)
      expect(res).toBeDefined()
    })
  })

  describe('GET /api/grades/classroom/[classroomId]', () => {
    it('should return grades for classroom', async () => {
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ id: 'sem-1', type: 'ODD' } as any)
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({ id: 'cls-1', name: '8A' } as any)
      vi.mocked(prisma.teachingAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.studentClass.findMany).mockResolvedValue([])

      const event = createMockEvent({ params: { classroomId: 'cls-1' } })
      const res = await classroomGradesHandler(event)
      expect(res).toBeDefined()
    })
  })

  describe('GET /api/grades/student/[studentId]', () => {
    it('should return student report card grades', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({ id: 'st-1', nis: '1001', user: { fullname: 'Ahmad' } } as any)
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ id: 'sem-1', type: 'ODD', academicYear: { name: '2024/2025' } } as any)
      vi.mocked(prisma.studentClass.findFirst).mockResolvedValue({ classroom: { name: '8A' } } as any)
      vi.mocked(prisma.studentClass.findMany).mockResolvedValue([])
      vi.mocked(prisma.gradeSummary.findMany).mockResolvedValue([])

      const event = createMockEvent({ params: { studentId: 'st-1' } })
      const res = await studentGradesHandler(event)
      expect(res).toBeDefined()
    })
  })
})
