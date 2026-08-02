import { prisma } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  const query = getQuery(event)

  const studentId = query.studentId as string
  let courseId = query.courseId ? Number(query.courseId) : undefined
  const teachingId = query.teachingId as string

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter studentId wajib diisi.'
    })
  }

  // Jika user yang login adalah SISWA, pastikan ia hanya bisa melihat nilainya sendiri
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (!student || student.id !== studentId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Akses ditolak. Anda hanya dapat melihat komponen nilai Anda sendiri.'
      })
    }
  }

  try {
    // Jika teachingId dikirim alih-alih courseId, cari courseId dari TeachingAssignment
    if (!courseId && teachingId) {
      const teaching = await prisma.teachingAssignment.findUnique({
        where: { id: teachingId }
      })
      if (teaching) {
        courseId = teaching.courseId
      }
    }

    // 1. Ambil GradeComponent yang tersimpan untuk siswa
    const components = await prisma.gradeComponent.findMany({
      where: {
        studentId,
        ...(courseId && {
          gradeItem: {
            courseId
          }
        })
      },
      include: {
        gradeItem: {
          select: {
            id: true,
            name: true,
            itemType: true,
            category: true,
            courseId: true
          }
        }
      },
      orderBy: {
        lastSync: 'desc'
      }
    })

    if (components.length > 0) {
      return {
        status: 'success',
        data: components
      }
    }

    // 2. Jika komponen individual belum tersimpan, periksa apakah ada GradeSummary (PH, STS, SAS)
    if (teachingId) {
      const summaries = await prisma.gradeSummary.findMany({
        where: {
          studentId,
          teachingId
        }
      })

      if (summaries.length > 0) {
        const syntheticComponents = summaries.map((s, idx) => ({
          id: `summary-${s.id}`,
          studentId: s.studentId,
          gradeItemId: 900000 + idx,
          score: s.score,
          moodleScore: s.score,
          isManual: true,
          lastSync: s.updatedAt || s.calculatedAt,
          gradeItem: {
            id: 900000 + idx,
            name: s.category === 'PH' ? 'Penilaian Harian (Rekap Rata-rata)' : s.category === 'STS' ? 'Sumatif Tengah Semester (STS)' : 'Sumatif Akhir Semester (SAS)',
            itemType: 'SUMMARY',
            category: s.category,
            courseId: courseId || 0
          }
        }))

        return {
          status: 'success',
          data: syntheticComponents
        }
      }
    }

    // 3. Jika tidak ada GradeSummary, periksa apakah ada GradeItem di course
    if (courseId) {
      const gradeItems = await prisma.gradeItem.findMany({
        where: { courseId },
        orderBy: { id: 'asc' }
      })

      if (gradeItems.length > 0) {
        const itemsWithNullScores = gradeItems.map((item) => ({
          id: `item-${item.id}`,
          studentId,
          gradeItemId: item.id,
          score: null,
          moodleScore: null,
          isManual: false,
          lastSync: null,
          gradeItem: {
            id: item.id,
            name: item.name,
            itemType: item.itemType || 'ASSIGNMENT',
            category: item.category || 'PH',
            courseId: item.courseId
          }
        }))

        return {
          status: 'success',
          data: itemsWithNullScores
        }
      }
    }

    // 4. Fallback Terakhir: Tampilkan struktur default (PH, STS, SAS) dengan skor null
    const defaultCategories = [
      { name: 'Penilaian Harian (PH)', category: 'PH' },
      { name: 'Sumatif Tengah Semester (STS)', category: 'STS' },
      { name: 'Sumatif Akhir Semester (SAS)', category: 'SAS' }
    ]

    const fallbackItems = defaultCategories.map((item, idx) => ({
      id: `default-${idx}`,
      studentId,
      gradeItemId: 990000 + idx,
      score: null,
      moodleScore: null,
      isManual: true,
      lastSync: null,
      gradeItem: {
        id: 990000 + idx,
        name: item.name,
        itemType: 'SUMMARY',
        category: item.category as any,
        courseId: courseId || 0
      }
    }))

    return {
      status: 'success',
      data: fallbackItems
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching grade components:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil detail komponen nilai.'
    })
  }
})
