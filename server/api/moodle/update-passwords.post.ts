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

  // 2. Map Moodle User IDs (using moodleUserId from DB, or lookup by username, email, & idnumber)
  const moodleUserMap: Record<string, number> = {}

  const chunkArray = <T>(arr: T[], size: number): T[][] => {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size))
    }
    return res
  }

  // 2a. Populate from DB user.moodleUserId first
  for (const s of students) {
    if (s.user?.moodleUserId) {
      const u = sanitizeUsername(s.nis || s.user.username, s.user.email)
      moodleUserMap[u.toLowerCase()] = s.user.moodleUserId
      if (s.user.email) moodleUserMap[s.user.email.toLowerCase()] = s.user.moodleUserId
      if (s.nis) moodleUserMap[s.nis] = s.user.moodleUserId
    }
  }

  // 2b. Lookup missing users by username
  const missingUsernames = students
    .filter(s => !moodleUserMap[sanitizeUsername(s.nis || s.user?.username, s.user?.email).toLowerCase()])
    .map(s => sanitizeUsername(s.nis || s.user?.username, s.user?.email))
    .filter(Boolean)

  for (const chunk of chunkArray(missingUsernames, 50)) {
    try {
      const moodleUsers = await MoodleService.getUsersByField('username', chunk)
      if (Array.isArray(moodleUsers)) {
        for (const mu of moodleUsers) {
          if (mu && mu.id) {
            if (mu.username) moodleUserMap[mu.username.toLowerCase()] = mu.id
            if (mu.email) moodleUserMap[mu.email.toLowerCase()] = mu.id
            if (mu.idnumber) moodleUserMap[mu.idnumber] = mu.id
          }
        }
      }
    } catch (err) {
      console.warn('Gagal lookup user Moodle by username:', err)
    }
  }

  // 2c. Lookup missing users by email
  const missingEmails = students
    .filter(s => {
      const u = sanitizeUsername(s.nis || s.user?.username, s.user?.email)
      const em = s.user?.email || `${s.nis}@siswa.sekolah.id`
      return !moodleUserMap[u.toLowerCase()] && !moodleUserMap[em.toLowerCase()]
    })
    .map(s => s.user?.email || `${s.nis}@siswa.sekolah.id`)
    .filter(Boolean)

  for (const chunk of chunkArray(missingEmails, 50)) {
    try {
      const moodleUsers = await MoodleService.getUsersByField('email', chunk)
      if (Array.isArray(moodleUsers)) {
        for (const mu of moodleUsers) {
          if (mu && mu.id) {
            if (mu.username) moodleUserMap[mu.username.toLowerCase()] = mu.id
            if (mu.email) moodleUserMap[mu.email.toLowerCase()] = mu.id
            if (mu.idnumber) moodleUserMap[mu.idnumber] = mu.id
          }
        }
      }
    } catch (err) {
      console.warn('Gagal lookup user Moodle by email:', err)
    }
  }

  // 3. Generate Passwords & Prepare Update Payloads
  const moodleUpdates: { id: number; username?: string; idnumber?: string; password: string }[] = []
  const dbUpdates: { studentId: string; userId?: string; moodleUserId?: number; password: string }[] = []

  for (const s of students) {
    const username = sanitizeUsername(s.nis || s.user?.username, s.user?.email)
    const em = s.user?.email?.toLowerCase() || ''
    const moodleUserId = s.user?.moodleUserId || moodleUserMap[username.toLowerCase()] || moodleUserMap[em] || moodleUserMap[s.nis]

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
        username,
        idnumber: s.nis,
        password: newPassword
      })
    }

    dbUpdates.push({
      studentId: s.id,
      userId: s.userId,
      moodleUserId,
      password: newPassword
    })
  }

  // 4. Execute Moodle Password Update (in batch chunks of 20)
  let updatedMoodleCount = 0

  if (moodleUpdates.length > 0) {
    const updateChunks = chunkArray(moodleUpdates, 20)
    for (const batch of updateChunks) {
      try {
        await MoodleService.updateUsers(batch)
        updatedMoodleCount += batch.length
      } catch (err) {
        console.error('Gagal update batch password ke Moodle, mencoba per user...', err)
        for (const item of batch) {
          try {
            await MoodleService.updateUsers([item])
            updatedMoodleCount++
          } catch (singleErr) {
            console.error(`Gagal update password Moodle user [${item.id}]:`, singleErr)
          }
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
      message: `Update Password Siswa Mode [${mode}]: ${updatedMoodleCount} Akun Moodle Diperbarui.`
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
