import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { MoodleService } from '../../utils/moodle'

function sanitizeUsername(username?: string | null, email?: string | null): string {
  if (username && username.trim()) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    if (clean) return clean
  }
  if (email && email.includes('@')) {
    const parts = email.split('@')
    if (parts[0]) {
      const prefix = parts[0].trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '')
      if (prefix) return prefix
    }
  }
  return `student_${Date.now()}`
}

function generateRandom6Digits(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default defineEventHandler(async (event: any) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const body = ((await readBody(event as any)) || {}) as any

  const mode = body.mode === 'EXAM_STS_SAS' ? 'EXAM_STS_SAS' : 'HARIAN'
  const classroomId = body.classroomId && body.classroomId !== 'ALL' ? String(body.classroomId).trim() : undefined

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true }
  })

  // 1. Fetch Target Students (relation is `classes` on Student model)
  const students = await prisma.student.findMany({
    where: {
      ...(classroomId && activeSemester && {
        classes: {
          some: {
            classroomId: classroomId,
            semesterId: activeSemester.id
          }
        }
      })
    },
    include: {
      user: true,
      classes: {
        where: activeSemester ? { semesterId: activeSemester.id } : undefined,
        include: { classroom: true }
      }
    }
  })

  if (students.length === 0) {
    return {
      success: true,
      message: 'Tidak ada data siswa ditemukan untuk di-update.',
      summary: { updatedCount: 0, mode }
    }
  }

  // 2. Map Moodle User IDs
  const usernames = students.map(s => sanitizeUsername(s.nis || s.user?.username, s.user?.email))
  const moodleUserMap: Record<string, number> = {}

  try {
    const moodleUsers = await MoodleService.getUsersByField('username', usernames)
    if (Array.isArray(moodleUsers)) {
      for (const mu of moodleUsers) {
        if (mu && mu.username && mu.id) {
          moodleUserMap[mu.username.toLowerCase()] = mu.id
        }
      }
    }
  } catch (err) {
    console.error('Gagal mengambil data user Moodle saat update password:', err)
  }

  // 3. Generate Passwords & Prepare Update Payloads
  const moodleUpdates: { id: number; password: string }[] = []
  const dbUpdates: { studentId: string; password: string }[] = []

  for (const s of students) {
    const username = sanitizeUsername(s.nis || s.user?.username, s.user?.email)
    const moodleUserId = moodleUserMap[username.toLowerCase()]

    let newPassword = ''
    if (mode === 'HARIAN') {
      newPassword = `Bilie#${s.nis || '12345'}`
    } else {
      const code = generateRandom6Digits()
      newPassword = `Bilie#${code}`
    }

    if (moodleUserId) {
      moodleUpdates.push({
        id: moodleUserId,
        password: newPassword
      })
    }

    dbUpdates.push({
      studentId: s.id,
      password: newPassword
    })
  }

  // 4. Execute Moodle Password Update
  let updatedMoodleCount = 0

  if (moodleUpdates.length > 0) {
    try {
      await MoodleService.updateUsers(moodleUpdates)
      updatedMoodleCount = moodleUpdates.length
    } catch (err) {
      console.error('Gagal update batch password ke Moodle, mencoba per user...', err)
      for (const item of moodleUpdates) {
        try {
          await MoodleService.updateUsers([item])
          updatedMoodleCount++
        } catch (singleErr) {
          console.error(`Gagal update password Moodle user [${item.id}]:`, singleErr)
        }
      }
    }
  }

  // 5. Update Local Database DB
  for (const dbItem of dbUpdates) {
    await prisma.student.update({
      where: { id: dbItem.studentId },
      data: {
        moodlePassword: dbItem.password,
        moodlePasswordMode: mode
      }
    })
  }

  // 6. Log Sync Result
  await prisma.syncLog.create({
    data: {
      resource: 'USER',
      status: 'SUCCESS',
      details: `Update Password Siswa Mode [${mode}]: ${updatedMoodleCount} Akun Moodle Diperbarui.`
    }
  })

  return {
    success: true,
    message: `Update Password Siswa Mode [${mode}] Selesai: ${updatedMoodleCount} Akun Moodle Di-sync.`,
    summary: {
      totalStudents: students.length,
      moodleUpdated: updatedMoodleCount,
      mode
    }
  }
})
