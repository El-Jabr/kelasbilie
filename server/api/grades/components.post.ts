import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { calculateGradeSummary } from '../../utils/grades'
import { logActivity } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody(event)
  const items = Array.isArray(body?.items) ? body.items : [body]

  if (!items.length || !items[0]?.studentId || !items[0]?.gradeItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data nilai tidak valid.'
    })
  }

  // 1. Fetch unique student IDs & gradeItem IDs to get existing scores and metadata
  const studentIds = Array.from(new Set(items.map((i: any) => String(i.studentId))))
  const gradeItemIds = Array.from(new Set(items.map((i: any) => Number(i.gradeItemId))))

  const [existingComponents, students, gradeItems] = await Promise.all([
    prisma.gradeComponent.findMany({
      where: {
        studentId: { in: studentIds },
        gradeItemId: { in: gradeItemIds }
      }
    }),
    prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { fullname: true } } }
    }),
    prisma.gradeItem.findMany({
      where: { id: { in: gradeItemIds } }
    })
  ])

  const existingMap = new Map<string, number>()
  existingComponents.forEach(c => {
    existingMap.set(`${c.studentId}_${c.gradeItemId}`, c.score)
  })

  const studentMap = new Map<string, string>()
  students.forEach(s => {
    studentMap.set(s.id, s.user?.fullname || 'Siswa')
  })

  const gradeItemMap = new Map<number, string>()
  gradeItems.forEach(g => {
    gradeItemMap.set(g.id, g.name)
  })

  // 2. Perform upserts and track actual changes
  const results = []
  const changes: Array<{
    studentName: string
    itemName: string
    oldScore: number | null
    newScore: number
  }> = []

  for (const item of items) {
    const studentId = String(item.studentId)
    const gradeItemId = Number(item.gradeItemId)
    const score = Number(item.score ?? 0)

    const mapKey = `${studentId}_${gradeItemId}`
    const oldScore = existingMap.has(mapKey) ? existingMap.get(mapKey)! : null

    // Check if value actually changed or is new
    if (oldScore === null || oldScore !== score) {
      changes.push({
        studentName: studentMap.get(studentId) || 'Siswa',
        itemName: gradeItemMap.get(gradeItemId) || `Item #${gradeItemId}`,
        oldScore,
        newScore: score
      })
    }

    const updated = await prisma.gradeComponent.upsert({
      where: {
        studentId_gradeItemId: {
          studentId,
          gradeItemId
        }
      },
      update: {
        score,
        isManual: true,
        lastSync: new Date()
      },
      create: {
        studentId,
        gradeItemId,
        score,
        isManual: true,
        lastSync: new Date()
      }
    })
    results.push(updated)
  }

  // 3. Auto-calculate summary if teachingId & semesterId provided
  let subjectName = 'Mapel'
  let className = ''

  if (body?.teachingId && body?.semesterId) {
    try {
      await calculateGradeSummary(body.teachingId, body.semesterId)
    } catch (e) {
      console.error('Auto calculate grade summary error:', e)
    }

    const teaching = await prisma.teachingAssignment.findUnique({
      where: { id: body.teachingId },
      include: { subject: true, classroom: true }
    })
    if (teaching) {
      subjectName = teaching.subject?.name || 'Mapel'
      className = teaching.classroom?.name ? `Kelas ${teaching.classroom.name}` : ''
    }
  }

  // 4. Build detailed activity description based on actual changes
  const classLabel = className ? ` (${className})` : ''
  let logDescription = ''

  if (changes.length === 0) {
    logDescription = `Simpan nilai ${subjectName}${classLabel} - Tidak ada perubahan data`
  } else if (changes.length === 1) {
    const c = changes[0]
    const oldStr = c.oldScore !== null ? c.oldScore : '-'
    logDescription = `Edit nilai ${subjectName}${classLabel} - ${c.studentName}: ${c.itemName} (${oldStr} ➔ ${c.newScore})`
  } else if (changes.length <= 3) {
    const detailList = changes.map(c => {
      const oldStr = c.oldScore !== null ? c.oldScore : '-'
      return `${c.studentName} [${c.itemName}: ${oldStr} ➔ ${c.newScore}]`
    }).join(', ')
    logDescription = `Edit nilai ${subjectName}${classLabel} - ${detailList}`
  } else {
    const detailList = changes.slice(0, 3).map(c => {
      const oldStr = c.oldScore !== null ? c.oldScore : '-'
      return `${c.studentName} (${c.itemName}: ${oldStr} ➔ ${c.newScore})`
    }).join(', ')
    logDescription = `Edit ${changes.length} entri nilai ${subjectName}${classLabel}: ${detailList}, dll.`
  }

  await logActivity({
    event,
    userId: user.id,
    userName: user.fullname,
    category: 'GRADE',
    action: 'UPDATE_GRADE_MANUAL',
    description: logDescription,
    status: 'SUCCESS'
  })

  return {
    success: true,
    message: 'Nilai berhasil disimpan.',
    data: results
  }
})
