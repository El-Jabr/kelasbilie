import { prisma } from './db'
import type { GradeCategory } from '../../prisma/generated/client'

/**
 * Menghitung rekapitulasi nilai per kategori (PH, STS, SAS) untuk seluruh siswa
 * dalam sebuah TeachingAssignment pada semester tertentu.
 */
export async function calculateGradeSummary(teachingId: string, semesterId: string) {
  // 1. Ambil data TeachingAssignment beserta Course terkait
  const teaching = await prisma.teachingAssignment.findUnique({
    where: { id: teachingId },
    include: {
      course: true,
      classroom: true
    }
  })

  if (!teaching) {
    throw createError({
      statusCode: 404,
      statusMessage: 'TeachingAssignment tidak ditemukan.'
    })
  }

  // 2. Ambil semua GradeItem untuk course ini yang sudah memiliki kategori
  const gradeItems = await prisma.gradeItem.findMany({
    where: {
      courseId: teaching.courseId,
      category: { not: null }
    }
  })

  if (gradeItems.length === 0) {
    return {
      message: 'Tidak ada GradeItem dengan kategori yang valid pada course ini.',
      calculatedCount: 0
    }
  }

  // 3. Ambil seluruh daftar siswa yang terdaftar di kelas (StudentClass) & Enrollment
  const studentClasses = await prisma.studentClass.findMany({
    where: {
      classroomId: teaching.classroomId,
      semesterId: semesterId
    },
    select: { studentId: true }
  })

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: teaching.courseId },
    select: { studentId: true }
  })

  // Gabungkan ID siswa tanpa duplikasi
  const studentIds = Array.from(
    new Set([
      ...studentClasses.map((sc) => sc.studentId),
      ...enrollments.map((e) => e.studentId)
    ])
  )

  if (studentIds.length === 0) {
    return {
      message: 'Tidak ada siswa yang terdaftar di kelas/course ini.',
      calculatedCount: 0
    }
  }

  const categories: GradeCategory[] = ['PH', 'STS', 'SAS']
  let calculatedCount = 0

  // 4. Looping per siswa dan per kategori
  for (const studentId of studentIds) {
    for (const cat of categories) {
      const categoryItems = gradeItems.filter((item) => item.category === cat)

      if (categoryItems.length === 0) continue

      const itemIds = categoryItems.map((item) => item.id)

      // Ambil skor GradeComponent siswa untuk item dalam kategori ini
      const components = await prisma.gradeComponent.findMany({
        where: {
          studentId: studentId,
          gradeItemId: { in: itemIds }
        }
      })

      if (components.length > 0) {
        const totalScore = components.reduce((sum, comp) => sum + comp.score, 0)
        const averageScore = Number((totalScore / components.length).toFixed(2))

        // Simpan / perbarui rekap nilai ke GradeSummary
        await prisma.gradeSummary.upsert({
          where: {
            studentId_teachingId_semesterId_category: {
              studentId: studentId,
              teachingId: teachingId,
              semesterId: semesterId,
              category: cat
            }
          },
          create: {
            studentId: studentId,
            teachingId: teachingId,
            semesterId: semesterId,
            category: cat,
            score: averageScore
          },
          update: {
            score: averageScore,
            calculatedAt: new Date()
          }
        })

        calculatedCount++
      }
    }
  }

  return {
    teachingId,
    semesterId,
    studentCount: studentIds.length,
    calculatedCount
  }
}
