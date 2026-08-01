import { prisma } from '../../../utils/db'
import { requireRole } from '../../../utils/auth'
import { MoodleService } from '../../../utils/moodle'
import { calculateGradeSummary } from '../../../utils/grades'

/**
 * Helper untuk menentukan GradeCategory (PH, STS, SAS) dari nama Grade Item
 */
function mapGradeCategory(itemName: string | null): 'PH' | 'STS' | 'SAS' | null {
  if (!itemName) return 'PH'
  const nameUpper = itemName.toUpperCase()

  if (nameUpper.includes('STS') || nameUpper.includes('TENGAH SEMESTER') || nameUpper.includes('MID')) {
    return 'STS'
  }
  if (nameUpper.includes('SAS') || nameUpper.includes('PAS') || nameUpper.includes('AKHIR SEMESTER') || nameUpper.includes('FINAL')) {
    return 'SAS'
  }
  if (nameUpper.includes('PH') || nameUpper.includes('HARIAN') || nameUpper.includes('ULANGAN') || nameUpper.includes('QUIZ')) {
    return 'PH'
  }
  return 'PH'
}

// Helper pencarian & auto-linking user berdasarkan moodleUserId, Email, atau Username
async function findOrLinkLocalUser(mUser: { id: number, email?: string, username?: string }) {
  let localUser = await prisma.user.findFirst({
    where: { moodleUserId: mUser.id },
    include: { student: true, teacher: true }
  })

  if (localUser) return localUser

  if (mUser.email?.trim()) {
    localUser = await prisma.user.findFirst({
      where: { email: { equals: mUser.email.trim(), mode: 'insensitive' } },
      include: { student: true, teacher: true }
    })
  }

  if (!localUser && mUser.username?.trim()) {
    localUser = await prisma.user.findFirst({
      where: { username: { equals: mUser.username.trim(), mode: 'insensitive' } },
      include: { student: true, teacher: true }
    })
  }

  if (localUser && localUser.moodleUserId === null) {
    try {
      await prisma.user.update({
        where: { id: localUser.id },
        data: { moodleUserId: mUser.id }
      })
      localUser.moodleUserId = mUser.id
    } catch {
      // Ignore unique constraint error
    }
  }

  return localUser
}

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const startTime = Date.now()
  const body = await readBody<{ courseId: number | string }>(event)
  const courseId = Number(body?.courseId)

  if (!courseId || isNaN(courseId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Course Moodle (courseId) wajib diisi.'
    })
  }

  // Ensure course exists locally
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  })

  if (!course) {
    throw createError({
      statusCode: 404,
      statusMessage: `Course dengan ID Moodle ${courseId} tidak ditemukan di database lokal. Jalankan Sync Course terlebih dahulu.`
    })
  }

  let itemCount = 0
  let componentCount = 0

  try {
    const gradeReport = await MoodleService.getCourseGradeItems(courseId)
    const validGradeItemIds = new Set<number>()

    if (gradeReport && gradeReport.usergrades) {
      for (const uGrade of gradeReport.usergrades) {
        if (uGrade.courseid !== courseId) continue

        const localUser = await findOrLinkLocalUser({ id: uGrade.userid })
        const studentId = localUser?.student?.id

        for (const item of uGrade.gradeitems) {
          if (!item.itemname || item.itemtype === 'course') continue

          validGradeItemIds.add(item.id)
          const categoryEnum = mapGradeCategory(item.itemname)

          await prisma.gradeItem.upsert({
            where: { id: item.id },
            create: {
              id: item.id,
              courseId: courseId,
              name: item.itemname,
              itemType: item.itemtype,
              category: categoryEnum
            },
            update: {
              courseId: courseId,
              name: item.itemname,
              itemType: item.itemtype,
              category: categoryEnum
            }
          })
          itemCount++

          if (studentId && item.graderaw !== undefined && item.graderaw !== null) {
            const existingComp = await prisma.gradeComponent.findUnique({
              where: {
                studentId_gradeItemId: {
                  studentId: studentId,
                  gradeItemId: item.id
                }
              }
            })

            if (existingComp?.isManual) {
              await prisma.gradeComponent.update({
                where: { id: existingComp.id },
                data: {
                  moodleScore: Number(item.graderaw),
                  lastSync: new Date()
                }
              })
              continue
            }

            await prisma.gradeComponent.upsert({
              where: {
                studentId_gradeItemId: {
                  studentId: studentId,
                  gradeItemId: item.id
                }
              },
              create: {
                studentId: studentId,
                gradeItemId: item.id,
                score: Number(item.graderaw),
                moodleScore: Number(item.graderaw),
                isManual: false,
                lastSync: new Date()
              },
              update: {
                score: Number(item.graderaw),
                moodleScore: Number(item.graderaw),
                lastSync: new Date()
              }
            })
            componentCount++
          }
        }
      }
    }

    // Mirror cleanup for this specific course
    const existingLocalItems = await prisma.gradeItem.findMany({
      where: { courseId: courseId },
      select: { id: true }
    })
    const orphanItemIds = existingLocalItems
      .map((i: { id: number }) => i.id)
      .filter((id: number) => !validGradeItemIds.has(id))

    if (orphanItemIds.length > 0) {
      await prisma.gradeComponent.deleteMany({
        where: { gradeItemId: { in: orphanItemIds } }
      })
      await prisma.gradeItem.deleteMany({
        where: { id: { in: orphanItemIds } }
      })
    }

    const teachings = await prisma.teachingAssignment.findMany({
      where: { courseId: courseId }
    })
    for (const teaching of teachings) {
      await calculateGradeSummary(teaching.id, teaching.semesterId)
      
      // Invalidate AI Analysis Cache
      await prisma.aiAnalysisCache.deleteMany({
        where: {
          OR: [
            { type: 'class', refId: teaching.classroomId, semesterId: teaching.semesterId },
            { type: 'subject', refId: teaching.id, semesterId: teaching.semesterId }
            // Note: student cache is also invalidated below
          ]
        }
      })
    }
    
    // Invalidate AI student caches for all students in this course
    if (gradeReport && gradeReport.usergrades) {
      for (const uGrade of gradeReport.usergrades) {
        if (uGrade.courseid !== courseId) continue
        const localUser = await findOrLinkLocalUser({ id: uGrade.userid })
        const studentId = localUser?.student?.id
        if (studentId) {
          await prisma.aiAnalysisCache.deleteMany({
            where: { type: 'student', refId: studentId }
          })
        }
      }
    }

    const durationMs = Date.now() - startTime
    const message = `Berhasil menyingkronkan course "${course.fullname}": ${itemCount} grade item dan ${componentCount} komponen nilai.`

    await prisma.syncLog.create({
      data: {
        resource: 'GRADE',
        status: 'SUCCESS',
        message
      }
    })

    return {
      status: 'success',
      message,
      data: {
        courseId,
        courseName: course.fullname,
        itemCount,
        componentCount,
        durationMs
      }
    }
  } catch (err: any) {
    console.error(`Sync Grade Per-Course Error (Course ${courseId}):`, err)
    await prisma.syncLog.create({
      data: {
        resource: 'GRADE',
        status: 'FAILED',
        message: err.message || `Gagal menyingkronkan data nilai untuk course ID ${courseId}.`
      }
    })

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Gagal menyingkronkan nilai dari Moodle untuk course ini.'
    })
  }
})
