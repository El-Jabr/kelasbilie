import { describe, it, expect, vi } from 'vitest'
import listTeachersHandler from '~/server/api/teachers/index.get'
import createTeacherHandler from '~/server/api/teachers/index.post'
import patchTeacherHandler from '~/server/api/teachers/[id].patch'
import deleteTeacherHandler from '~/server/api/teachers/[id].delete'

import listSubjectsHandler from '~/server/api/subjects/index.get'
import createSubjectHandler from '~/server/api/subjects/index.post'
import updateSubjectHandler from '~/server/api/subjects/[id].patch'
import deleteSubjectHandler from '~/server/api/subjects/[id].delete'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    teacher: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    subject: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
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

describe('Teachers & Subjects API Unit Tests', () => {
  describe('Teachers Endpoints', () => {
    it('GET /api/teachers - list teachers', async () => {
      const mockTeachers = [{ id: 't-1', nip: '12345', user: { fullname: 'Ustadz Ahmad' } }]
      vi.mocked(prisma.teacher.count).mockResolvedValue(1)
      vi.mocked(prisma.teacher.findMany).mockResolvedValue(mockTeachers as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listTeachersHandler(event)
      expect(res.data).toEqual(mockTeachers)
    })

    it('POST /api/teachers - create teacher', async () => {
      const newUser = { id: 'u-2', fullname: 'Ustadz Ali' }
      const newTeacher = { id: 't-2', nip: '67890', userId: 'u-2', user: newUser }

      vi.mocked(prisma.user.create).mockResolvedValue(newUser as any)
      vi.mocked(prisma.teacher.create).mockResolvedValue(newTeacher as any)

      const event = createMockEvent({
        method: 'POST',
        body: { nip: '67890', fullname: 'Ustadz Ali', email: 'ali@test.id', password: 'password123' }
      })

      const res = await createTeacherHandler(event)
      expect(res.success).toBe(true)
    })

    it('PATCH /api/teachers/[id] - update teacher', async () => {
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({ id: 't-1', userId: 'u-1' } as any)
      vi.mocked(prisma.teacher.update).mockResolvedValue({ id: 't-1', nip: '9999' } as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: 't-1' },
        body: { nip: '9999' }
      })

      const res = await patchTeacherHandler(event)
      expect(res.success).toBe(true)
    })

    it('DELETE /api/teachers/[id] - delete teacher', async () => {
      vi.mocked(prisma.teacher.findUnique).mockResolvedValue({
        id: 't-1', userId: 'u-1', _count: { teachings: 0, homerooms: 0 }
      } as any)
      vi.mocked(prisma.teacher.delete).mockResolvedValue({ id: 't-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 't-1' }
      })

      const res = await deleteTeacherHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('Subjects Endpoints', () => {
    it('GET /api/subjects - list subjects', async () => {
      const mockSubjects = [{ id: 'sb-1', code: 'IPA8', name: 'IPA 8', kkm: 75 }]
      vi.mocked(prisma.subject.count).mockResolvedValue(1)
      vi.mocked(prisma.subject.findMany).mockResolvedValue(mockSubjects as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await listSubjectsHandler(event)
      expect(res.data).toEqual(mockSubjects)
    })

    it('POST /api/subjects - create subject with KKM', async () => {
      const newSubject = { id: 'sb-2', code: 'MTK7', name: 'Matematika 7', kkm: 75 }
      vi.mocked(prisma.subject.create).mockResolvedValue(newSubject as any)

      const event = createMockEvent({
        method: 'POST',
        body: { code: 'MTK7', name: 'Matematika 7', kkm: 75 }
      })

      const res = await createSubjectHandler(event)
      expect(res.success).toBe(true)
    })

    it('PUT /api/subjects/[id] - update subject KKM and details', async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({ id: 'sb-1' } as any)
      vi.mocked(prisma.subject.update).mockResolvedValue({ id: 'sb-1', kkm: 80 } as any)

      const event = createMockEvent({
        method: 'PATCH',
        params: { id: 'sb-1' },
        body: { kkm: 80 }
      })

      const res = await updateSubjectHandler(event)
      expect(res.success).toBe(true)
    })

    it('DELETE /api/subjects/[id] - delete subject', async () => {
      vi.mocked(prisma.subject.findUnique).mockResolvedValue({
        id: 'sb-1', _count: { teachings: 0 }
      } as any)
      vi.mocked(prisma.subject.delete).mockResolvedValue({ id: 'sb-1' } as any)

      const event = createMockEvent({
        method: 'DELETE',
        params: { id: 'sb-1' }
      })

      const res = await deleteSubjectHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
