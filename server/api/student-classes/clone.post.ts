import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = await readBody<{
    fromSemesterId: string
    toSemesterId: string
    promoteLevel?: boolean
  }>(event)

  if (!body.fromSemesterId || !body.toSemesterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semester asal (fromSemesterId) dan Semester tujuan (toSemesterId) wajib dipilih.'
    })
  }

  if (body.fromSemesterId === body.toSemesterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semester asal dan semester tujuan tidak boleh sama.'
    })
  }

  // Ambil semua StudentClass dari semester asal
  const sourceClasses = await prisma.studentClass.findMany({
    where: { semesterId: body.fromSemesterId },
    include: {
      classroom: true,
      student: {
        include: { user: true }
      }
    }
  })

  if (!sourceClasses.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tidak ada data siswa terdaftar di semester asal.'
    })
  }

  // Ambil daftar seluruh kelas untuk matching target classroom
  const allClassrooms = await prisma.classroom.findMany()

  let clonedCount = 0
  let skippedCount = 0

  for (const sc of sourceClasses) {
    // Abaikan jika siswa tidak aktif
    if (!sc.student.user?.isActive) {
      skippedCount++
      continue
    }

    let targetClassroom = sc.classroom

    if (body.promoteLevel) {
      // Logika kenaikan kelas: level 7 -> 8, 8 -> 9, VII -> VIII, VIII -> IX
      const currentLevelNum = parseInt(String(sc.classroom.level).replace(/\D/g, ''), 10)
      if (!isNaN(currentLevelNum)) {
        const nextLevelNum = currentLevelNum + 1
        if (nextLevelNum > 9) {
          // Lulus (misal kelas IX naik ke X di SMP = lulus)
          skippedCount++
          continue
        }

        // Cari kelas target dengan level nextLevelNum dan suffix nama yang mirip (misal VII A -> VIII A)
        const currentSuffix = sc.classroom.name.replace(/^[IVX0-9\s-]+/i, '').trim()
        const matched = allClassrooms.find(c => {
          const cLevel = parseInt(String(c.level).replace(/\D/g, ''), 10)
          const cSuffix = c.name.replace(/^[IVX0-9\s-]+/i, '').trim()
          return cLevel === nextLevelNum && (cSuffix === currentSuffix || c.name.includes(currentSuffix))
        }) || allClassrooms.find(c => parseInt(String(c.level).replace(/\D/g, ''), 10) === nextLevelNum)

        if (matched) {
          targetClassroom = matched
        }
      }
    }

    // Upsert ke StudentClass semester baru
    await prisma.studentClass.upsert({
      where: {
        studentId_semesterId: {
          studentId: sc.studentId,
          semesterId: body.toSemesterId
        }
      },
      create: {
        studentId: sc.studentId,
        classroomId: targetClassroom.id,
        semesterId: body.toSemesterId
      },
      update: {
        classroomId: targetClassroom.id
      }
    })
    clonedCount++
  }

  return {
    success: true,
    message: `Proses clone selesai. ${clonedCount} siswa berhasil dipindahkan, ${skippedCount} siswa dilewati (lulus/non-aktif).`,
    clonedCount,
    skippedCount
  }
})
