import { describe, it, expect, vi } from 'vitest'
import settingsGetHandler from '~/server/api/settings/index.get'
import settingsPatchHandler from '~/server/api/settings/index.patch'
import statsHandler from '~/server/api/dashboard/stats.get'

import debugLogsHandler from '~/server/api/monitoring/debug-logs.get'
import clientLogHandler from '~/server/api/monitoring/client-log.post'
import resetLogsHandler from '~/server/api/monitoring/reset-logs.post'
import testErrorHandler from '~/server/api/monitoring/test-error.post'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    schoolSetting: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { count: vi.fn() },
    student: { count: vi.fn() },
    teacher: { count: vi.fn() },
    classroom: { count: vi.fn() },
    subject: { count: vi.fn() },
    academicYear: { findFirst: vi.fn() },
    semester: { findFirst: vi.fn() },
    syncLog: { findMany: vi.fn() },
    $transaction: vi.fn((promises) => Promise.all(promises))
  }
}))

describe('System Settings, Dashboard & Monitoring API Unit Tests', () => {
  describe('Settings Endpoints', () => {
    it('GET /api/settings - return school settings', async () => {
      const mockSettings = { schoolName: 'Kelasbilie', aiEnabled: true, aiSystemPrompt: 'Pesantren' }
      vi.mocked(prisma.schoolSetting.findFirst).mockResolvedValue(mockSettings as any)

      const event = createMockEvent()
      const res = await settingsGetHandler(event)
      expect(res.data.schoolName).toBe('Kelasbilie')
      expect(res.data.aiSystemPrompt).toBe('Pesantren')
    })

    it('PATCH /api/settings - update school settings and AI prompt', async () => {
      const mockUpdated = { schoolName: 'Kelasbilie Boarding', aiEnabled: true, aiSystemPrompt: 'Sebut orang tua Murobbi' }
      vi.mocked(prisma.schoolSetting.findFirst).mockResolvedValue({ id: 'set-1' } as any)
      vi.mocked(prisma.schoolSetting.update).mockResolvedValue(mockUpdated as any)

      const event = createMockEvent({
        method: 'PATCH',
        body: { schoolName: 'Kelasbilie Boarding', aiEnabled: true, aiSystemPrompt: 'Sebut orang tua Murobbi' }
      })

      const res = await settingsPatchHandler(event)
      expect(res.status).toBe('success')
    })
  })

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard/stats - return application statistics', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(135)
      vi.mocked(prisma.student.count).mockResolvedValue(120)
      vi.mocked(prisma.teacher.count).mockResolvedValue(15)
      vi.mocked(prisma.classroom.count).mockResolvedValue(6)
      vi.mocked(prisma.academicYear.findFirst).mockResolvedValue({ name: '2024/2025' } as any)
      vi.mocked(prisma.semester.findFirst).mockResolvedValue({ type: 'ODD' } as any)
      vi.mocked(prisma.syncLog.findMany).mockResolvedValue([])

      const event = createMockEvent({ user: { role: 'SUPER_ADMIN' } })
      const res = await statsHandler(event)
      expect(res.data.totalStudents).toBe(120)
      expect(res.data.totalUsers).toBe(135)
    })
  })

  describe('Monitoring Endpoints', () => {
    it('GET /api/monitoring/debug-logs - list system logs', async () => {
      const event = createMockEvent()
      const res = await debugLogsHandler(event)
      expect(res).toBeDefined()
    })

    it('POST /api/monitoring/client-log - log frontend errors', async () => {
      const event = createMockEvent({
        method: 'POST',
        body: { message: 'Frontend UI Error Test', stack: 'Error trace' }
      })
      const res = await clientLogHandler(event)
      expect(res.success).toBe(true)
    })

    it('POST /api/monitoring/reset-logs - reset log files', async () => {
      const event = createMockEvent({ method: 'POST' })
      const res = await resetLogsHandler(event)
      expect(res.success).toBe(true)
    })

    it('POST /api/monitoring/test-error - trigger test backend error', () => {
      const event = createMockEvent({ method: 'POST' })
      expect(() => testErrorHandler(event)).toThrow()
    })
  })
})
