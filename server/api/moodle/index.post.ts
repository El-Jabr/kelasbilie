import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { MoodleService } from '../../utils/moodle'
import { calculateGradeSummary } from '../../utils/grades'

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

export default defineEventHandler(async (event) => {
  // Memastikan hanya SUPER_ADMIN atau ADMIN yang dapat menjalankan trigger sinkronisasi
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const query = getQuery(event)
  const resource = (query.resource as string || 'ALL').toUpperCase()

  const syncResults: Record<string, any> = {}

  // 1. Sync Course Categories
  if (resource === 'ALL' || resource === 'CATEGORY') {
    try {
      const categories = await MoodleService.getCategories()
      let count = 0

      for (const cat of categories) {
        await prisma.courseCategory.upsert({
          where: { id: cat.id },
          create: {
            id: cat.id,
            name: cat.name,
            parentId: cat.parent === 0 ? null : cat.parent,
            depth: cat.depth
          },
          update: {
            name: cat.name,
            parentId: cat.parent === 0 ? null : cat.parent,
            depth: cat.depth
          }
        })
        count++
      }

      await prisma.syncLog.create({
        data: {
          resource: 'CATEGORY',
          status: 'SUCCESS',
          message: `Berhasil menyingkronkan ${count} kategori dari Moodle.`
        }
      })
      syncResults.category = { status: 'SUCCESS', count }
    } catch (err: any) {
      console.error('Sync Category Error:', err)
      await prisma.syncLog.create({
        data: {
          resource: 'CATEGORY',
          status: 'FAILED',
          message: err.message || 'Gagal menyingkronkan kategori.'
        }
      })
      syncResults.category = { status: 'FAILED', error: err.message }
    }
  }

  // 2. Sync Courses
  if (resource === 'ALL' || resource === 'COURSE') {
    try {
      const courses = await MoodleService.getCourses()
      let count = 0

      for (const course of courses) {
        // Pastikan categoryId ada di database lokal agar tidak melanggar FK constraint
        const catExists = await prisma.courseCategory.findUnique({
          where: { id: course.categoryid }
        })

        if (!catExists) {
          // Jika kategori belum ada, buat record dummy kategori
          await prisma.courseCategory.create({
            data: {
              id: course.categoryid,
              name: `Category ${course.categoryid}`,
              depth: 1
            }
          })
        }

        await prisma.course.upsert({
          where: { id: course.id },
          create: {
            id: course.id,
            fullname: course.fullname,
            shortname: course.shortname,
            categoryId: course.categoryid,
            visible: course.visible === 1,
            lastSync: new Date()
          },
          update: {
            fullname: course.fullname,
            shortname: course.shortname,
            categoryId: course.categoryid,
            visible: course.visible === 1,
            lastSync: new Date()
          }
        })
        count++
      }

      await prisma.syncLog.create({
        data: {
          resource: 'COURSE',
          status: 'SUCCESS',
          message: `Berhasil menyingkronkan ${count} course dari Moodle.`
        }
      })
      syncResults.course = { status: 'SUCCESS', count }
    } catch (err: any) {
      console.error('Sync Course Error:', err)
      await prisma.syncLog.create({
        data: {
          resource: 'COURSE',
          status: 'FAILED',
          message: err.message || 'Gagal menyingkronkan course.'
        }
      })
      syncResults.course = { status: 'FAILED', error: err.message }
    }
  }

  // 3. Sync Enrollments
  if (resource === 'ALL' || resource === 'USER' || resource === 'ENROLLMENT') {
    try {
      const courses = await prisma.course.findMany()
      let count = 0

      for (const course of courses) {
        try {
          const enrolledUsers = await MoodleService.getEnrolledUsers(course.id)

          for (const mUser of enrolledUsers) {
            // Cari user lokal berdasarkan moodleUserId
            const localUser = await prisma.user.findFirst({
              where: { moodleUserId: mUser.id },
              include: { student: true }
            })

            if (localUser && localUser.student) {
              await prisma.enrollment.upsert({
                where: {
                  studentId_courseId: {
                    studentId: localUser.student.id,
                    courseId: course.id
                  }
                },
                create: {
                  studentId: localUser.student.id,
                  courseId: course.id
                },
                update: {}
              })
              count++
            }
          }
        } catch (e: any) {
          console.warn(`Gagal fetch enrollment course ID ${course.id}:`, e.message)
        }
      }

      await prisma.syncLog.create({
        data: {
          resource: 'USER',
          status: 'SUCCESS',
          message: `Berhasil menyingkronkan ${count} pendaftaran siswa (enrollments).`
        }
      })
      syncResults.enrollment = { status: 'SUCCESS', count }
    } catch (err: any) {
      console.error('Sync Enrollment Error:', err)
      await prisma.syncLog.create({
        data: {
          resource: 'USER',
          status: 'FAILED',
          message: err.message || 'Gagal menyingkronkan enrollment.'
        }
      })
      syncResults.enrollment = { status: 'FAILED', error: err.message }
    }
  }

  // 4. Sync GradeItems & GradeComponents
  if (resource === 'ALL' || resource === 'GRADE') {
    try {
      const courses = await prisma.course.findMany()
      let itemCount = 0
      let componentCount = 0

      for (const course of courses) {
        try {
          const gradeReport = await MoodleService.getCourseGradeItems(course.id)

          if (gradeReport && gradeReport.usergrades) {
            for (const uGrade of gradeReport.usergrades) {
              // Cari siswa lokal berdasarkan moodleUserId
              const localUser = await prisma.user.findFirst({
                where: { moodleUserId: uGrade.userid },
                include: { student: true }
              })

              const studentId = localUser?.student?.id

              for (const item of uGrade.gradeitems) {
                // Jangan simpan item kuis/modul yang tidak memiliki nama atau merupakan akumulasi total course
                if (!item.itemname || item.itemtype === 'course') continue

                const categoryEnum = mapGradeCategory(item.itemname)

                // Upsert GradeItem
                await prisma.gradeItem.upsert({
                  where: { id: item.id },
                  create: {
                    id: item.id,
                    courseId: course.id,
                    name: item.itemname,
                    itemType: item.itemtype,
                    category: categoryEnum
                  },
                  update: {
                    name: item.itemname,
                    itemType: item.itemtype,
                    category: categoryEnum
                  }
                })
                itemCount++

                // Jika ada skor dan siswa terdaftar di sistem lokal, upsert GradeComponent (proteksi nilai manual)
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
                    // Skip jika nilai sudah diisi manual oleh guru
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
                      isManual: false,
                      lastSync: new Date()
                    },
                    update: {
                      score: Number(item.graderaw),
                      lastSync: new Date()
                    }
                  })
                  componentCount++
                }
              }
            }
          }
        } catch (e: any) {
          console.warn(`Gagal fetch grade report course ID ${course.id}:`, e.message)
        }
      }

      await prisma.syncLog.create({
        data: {
          resource: 'GRADE',
          status: 'SUCCESS',
          message: `Berhasil menyingkronkan ${itemCount} grade item dan ${componentCount} komponen nilai.`
        }
      })

      // Trigger auto-calculate GradeSummary untuk TeachingAssignment terkait pada semester aktif
      try {
        const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } })
        if (activeSemester) {
          const teachings = await prisma.teachingAssignment.findMany({
            where: { semesterId: activeSemester.id }
          })
          for (const teaching of teachings) {
            await calculateGradeSummary(teaching.id, activeSemester.id)
          }
        }
      } catch (autoCalcErr: any) {
        console.warn('Auto-calculate GradeSummary warning:', autoCalcErr.message)
      }

      syncResults.grade = { status: 'SUCCESS', itemCount, componentCount }
    } catch (err: any) {
      console.error('Sync Grade Error:', err)
      await prisma.syncLog.create({
        data: {
          resource: 'GRADE',
          status: 'FAILED',
          message: err.message || 'Gagal menyingkronkan data nilai.'
        }
      })
      syncResults.grade = { status: 'FAILED', error: err.message }
    }
  }

  return {
    status: 'success',
    message: `Proses sinkronisasi [${resource}] selesai.`,
    data: syncResults
  }
})
