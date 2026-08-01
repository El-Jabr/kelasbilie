import { describe, it, expect, vi } from 'vitest'
import moodleGetHandler from '~/server/api/moodle/index.get'
import moodlePostHandler from '~/server/api/moodle/index.post'
import testConnHandler from '~/server/api/moodle/test-connection.post'
import exportUsersHandler from '~/server/api/moodle/export-users.post'
import updatePasswordsHandler from '~/server/api/moodle/update-passwords.post'
import logsHandler from '~/server/api/moodle/logs.get'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    schoolSetting: { findFirst: vi.fn() },
    syncLog: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    user: { findMany: vi.fn(), update: vi.fn() },
    teacher: { findMany: vi.fn() },
    student: { findMany: vi.fn() },
    semester: { findFirst: vi.fn() },
    $transaction: vi.fn((promises) => Promise.all(promises))
  }
}))

describe('Moodle Integration API Unit Tests', () => {
  describe('POST /api/moodle/test-connection', () => {
    it('should throw validation error if credentials missing', async () => {
      const event = createMockEvent({
        method: 'POST',
        body: {}
      })
      await expect(testConnHandler(event)).rejects.toThrow()
    })
  })

  describe('GET /api/moodle/logs', () => {
    it('should list sync logs', async () => {
      const mockLogs = [{ id: 'log-1', status: 'SUCCESS', message: 'Synced' }]
      vi.mocked(prisma.syncLog.count).mockResolvedValue(1)
      vi.mocked(prisma.syncLog.findMany).mockResolvedValue(mockLogs as any)

      const event = createMockEvent({ query: { page: 1, limit: 10 } })
      const res = await logsHandler(event)
      expect(res.data).toEqual(mockLogs)
    })
  })

  describe('POST /api/moodle/export-users', () => {
    it('should export users for moodle', async () => {
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ id: 'sem-1' } as any)
      vi.mocked(prisma.teacher.findMany).mockResolvedValue([])
      vi.mocked(prisma.student.findMany).mockResolvedValue([])

      const event = createMockEvent({ method: 'POST', body: {} })
      const res = await exportUsersHandler(event)
      expect(res.success).toBe(true)
    })
  })

  describe('POST /api/moodle/update-passwords', () => {
    it('should update user passwords', async () => {
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ id: 'sem-1' } as any)
      vi.mocked(prisma.student.findMany).mockResolvedValue([])
      const event = createMockEvent({
        method: 'POST',
        body: { users: [{ email: 'ahmad@test.id', password: 'newpassword123' }] }
      })
      const res = await updatePasswordsHandler(event)
      expect(res.success).toBe(true)
    })
  })
})
