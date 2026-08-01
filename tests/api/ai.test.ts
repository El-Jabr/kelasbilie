import { describe, it, expect, vi } from 'vitest'
import analyzeStudentHandler from '~/server/api/ai/analyze-student.post'
import analyzeClassHandler from '~/server/api/ai/analyze-class.post'
import analyzeSubjectHandler from '~/server/api/ai/analyze-subject.post'

import { createMockEvent } from '../helpers/mockEvent'
import { prisma } from '~/server/utils/db'
import { callGeminiApi } from '~/server/utils/ai'

vi.mock('~/server/utils/db', () => ({
  prisma: {
    student: { findUnique: vi.fn() },
    classroom: { findUnique: vi.fn() },
    teachingAssignment: { findUnique: vi.fn(), findMany: vi.fn() },
    semester: { findFirst: vi.fn(), findUnique: vi.fn() },
    studentClass: { findUnique: vi.fn(), findMany: vi.fn() },
    gradeSummary: { findMany: vi.fn() },
    aiAnalysisCache: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
    schoolSetting: { findFirst: vi.fn() }
  }
}))

vi.mock('~/server/utils/ai', async () => {
  const actual = await vi.importActual('~/server/utils/ai') as any
  return {
    ...actual,
    callGeminiApi: vi.fn()
  }
})

describe('AI Analysis API Unit Tests', () => {
  describe('POST /api/ai/analyze-student', () => {
    it('should generate student analysis successfully', async () => {
      vi.mocked(prisma.student.findUnique).mockResolvedValue({
        id: 'st-1', nis: '1001', user: { fullname: 'Santri Ahmad' }
      } as any)

      vi.mocked(prisma.semester.findFirst).mockResolvedValue({
        id: 'sem-1', type: 'ODD', academicYear: { name: '2024/2025' }
      } as any)

      vi.mocked(prisma.studentClass.findUnique).mockResolvedValue({
        classroomId: 'cls-1',
        classroom: { name: '8A' },
        semester: { type: 'ODD', academicYear: { name: '2024/2025' } }
      } as any)

      vi.mocked(prisma.gradeSummary.findMany).mockResolvedValue([
        { teachingId: 't-1', category: 'PH', score: 85 },
        { teachingId: 't-1', category: 'STS', score: 78 },
        { teachingId: 't-1', category: 'SAS', score: 80 }
      ] as any)

      vi.mocked(prisma.aiAnalysisCache.findFirst).mockResolvedValue(null)

      const mockAiOutput = JSON.stringify({
        statusUmum: "baik",
        narasi: "Performa santri sangat istiqamah dalam pembelajaran.",
        kekuatan: ["Kemampuan pemahaman PH tinggi"],
        kelemahan: [],
        tren: "meningkat",
        rekomendasi: [{ tipe: "motivasi", mapel: "IPA", tindakan: "Pertahankan" }]
      })

      vi.mocked(callGeminiApi).mockResolvedValue(mockAiOutput)

      const event = createMockEvent({
        method: 'POST',
        user: { role: 'TEACHER' },
        body: { studentId: 'st-1', forceRefresh: true }
      })

      const res = await analyzeStudentHandler(event)
      expect(res.success).toBe(true)
      expect(res.data.statusUmum).toBe('baik')
      expect(res.data.narasi).toContain('Performa santri')
    })
  })

  describe('POST /api/ai/analyze-class', () => {
    it('should generate class analysis successfully', async () => {
      vi.mocked(prisma.classroom.findUnique).mockResolvedValue({
        id: 'cls-1', name: '8A SKT'
      } as any)

      vi.mocked(prisma.semester.findFirst).mockResolvedValue({
        id: 'sem-1', type: 'ODD', academicYear: { name: '2024/2025' }
      } as any)

      vi.mocked(prisma.studentClass.findMany).mockResolvedValue([{
        studentId: 'st-1', student: { nis: '1001', user: { fullname: 'Santri Ahmad' } }
      }] as any)

      vi.mocked(prisma.teachingAssignment.findMany).mockResolvedValue([{
        id: 't-1', subject: { name: 'IPA 8', kkm: 75 }
      }] as any)

      vi.mocked(prisma.aiAnalysisCache.findFirst).mockResolvedValue(null)

      const mockAiOutput = JSON.stringify({
        ringkasan: { rataRataKelas: 82.5, jumlahLulus: 10, jumlahRemidi: 0, mapelTerlemah: "IPA", mapelTerkuat: "IPA" },
        narasi: "Kelas 8A SKT menunjukkan kedisiplinan dan hafalan yang unggul.",
        siswaPerhatianKhusus: [],
        rekomendasiKelas: [{ prioritas: "tinggi", tindakan: "Pertahankan ritme muthala'ah", mapel: "IPA" }]
      })

      vi.mocked(callGeminiApi).mockResolvedValue(mockAiOutput)

      const event = createMockEvent({
        method: 'POST',
        user: { role: 'SUPER_ADMIN' },
        body: { classroomId: 'cls-1', forceRefresh: true }
      })

      const res = await analyzeClassHandler(event)
      expect(res.success).toBe(true)
      expect(res.data.ringkasan.rataRataKelas).toBe(82.5)
    })
  })

  describe('POST /api/ai/analyze-subject', () => {
    it('should generate subject analysis successfully', async () => {
      vi.mocked(prisma.teachingAssignment.findUnique).mockResolvedValue({
        id: 't-1',
        teacher: { userId: 'u-1', user: { fullname: 'Ustadz Ali' } },
        subject: { name: 'IPA 8', kkm: 75 },
        classroom: { name: '8A SKT' },
        semesterId: 'sem-1',
        semester: { type: 'ODD', academicYear: { name: '2024/2025' } }
      } as any)

      vi.mocked(prisma.studentClass.findMany).mockResolvedValue([{ studentId: 'st-1' }] as any)
      vi.mocked(prisma.gradeSummary.findMany).mockResolvedValue([{ studentId: 'st-1', category: 'PH', score: 90 }] as any)
      vi.mocked(prisma.aiAnalysisCache.findFirst).mockResolvedValue(null)

      const mockAiOutput = JSON.stringify({
        efektivitas: "tinggi",
        narasi: "Metode pengajaran Ustadz Ali terbukti efektif.",
        itemBermasalah: [],
        strategiPembelajaran: [{ prioritas: "sedang", saran: "Pengayaan materi" }]
      })

      vi.mocked(callGeminiApi).mockResolvedValue(mockAiOutput)

      const event = createMockEvent({
        method: 'POST',
        user: { id: 'u-1', role: 'TEACHER' },
        body: { teachingId: 't-1', forceRefresh: true }
      })

      const res = await analyzeSubjectHandler(event)
      expect(res.success).toBe(true)
      expect(res.data.efektivitas).toBe('tinggi')
    })
  })
})
