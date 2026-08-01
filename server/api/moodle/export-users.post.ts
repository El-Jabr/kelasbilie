import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { MoodleService, type MoodleCreateUserParam, type MoodleEnrolParam } from '../../utils/moodle'

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
  return `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

export default defineEventHandler(async (event: any) => {
  requireRole(event, ['SUPER_ADMIN'])

  const body = ((await readBody(event as any)) || {}) as any

  const targetRole = body.targetRole || 'ALL'
  const autoEnroll = body.autoEnroll !== false
  const defaultPassword = body.defaultPassword?.trim() || 'Bilie#123456'

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true }
  })

  // 1. Fetch Teachers & Students from App DB
  let teachers: any[] = []
  let students: any[] = []

  if (targetRole === 'ALL' || targetRole === 'TEACHER') {
    teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        teachings: {
          where: activeSemester ? { semesterId: activeSemester.id } : undefined
        }
      }
    })
  }

  if (targetRole === 'ALL' || targetRole === 'STUDENT') {
    students = await prisma.student.findMany({
      include: {
        user: true,
        classes: {
          where: activeSemester ? { semesterId: activeSemester.id } : undefined
        }
      }
    })
  }

  // 2. Consolidate App Users to Process
  const userList: {
    appUserId: string
    type: 'TEACHER' | 'STUDENT'
    username: string
    firstname: string
    lastname: string
    email: string
    nipOrNis: string
    initialPassword: string
    coursesToEnroll: number[]
  }[] = []

  // Process Teachers
  for (const t of teachers) {
    if (!t || !t.user) continue
    const fullname = (t.user.fullname || 'Guru').trim()
    const nameParts = fullname.split(' ')
    const firstname = nameParts[0] || 'Guru'
    const lastname = nameParts.slice(1).join(' ') || 'Pengajar'
    const email = t.user.email?.trim() || `${t.nip || t.id}@sekolah.id`
    const username = sanitizeUsername(t.nip || t.user.username, email)

    const courseIds: number[] = []
    if (t && Array.isArray(t.teachings)) {
      for (const ta of t.teachings) {
        if (ta && typeof ta.courseId === 'number' && ta.courseId > 0) {
          courseIds.push(ta.courseId)
        }
      }
    }

    userList.push({
      appUserId: t.user.id,
      type: 'TEACHER',
      username,
      firstname,
      lastname,
      email,
      nipOrNis: t.nip || '-',
      initialPassword: defaultPassword,
      coursesToEnroll: Array.from(new Set(courseIds))
    })
  }

  // Process Students
  let classroomTeachingsMap: Record<string, number[]> = {}

  if (students.length > 0 && activeSemester) {
    const teachings = await prisma.teachingAssignment.findMany({
      where: { semesterId: activeSemester.id },
      select: { classroomId: true, courseId: true }
    })

    for (const ta of teachings) {
      if (!ta.classroomId || !ta.courseId) continue
      const list = classroomTeachingsMap[ta.classroomId] || []
      list.push(ta.courseId)
      classroomTeachingsMap[ta.classroomId] = list
    }
  }

  for (const s of students) {
    if (!s || !s.user) continue
    const fullname = (s.user.fullname || 'Siswa').trim()
    const nameParts = fullname.split(' ')
    const firstname = nameParts[0] || 'Siswa'
    const lastname = nameParts.slice(1).join(' ') || 'Sekolah'
    const email = s.user.email?.trim() || `${s.nis || s.id}@siswa.sekolah.id`
    const username = sanitizeUsername(s.nis || s.user.username, email)

    let courseIds: number[] = []
    const studentClassroom = s.classes?.[0]
    if (studentClassroom && classroomTeachingsMap[studentClassroom.classroomId]) {
      courseIds = classroomTeachingsMap[studentClassroom.classroomId] || []
    }

    const studentPass = s.moodlePassword || `Bilie#${s.nis || '12345'}`

    userList.push({
      appUserId: s.user.id,
      type: 'STUDENT',
      username,
      firstname,
      lastname,
      email,
      nipOrNis: s.nis || '-',
      initialPassword: studentPass,
      coursesToEnroll: Array.from(new Set(courseIds))
    })
  }

  if (userList.length === 0) {
    return {
      success: true,
      message: 'Tidak ada data user yang perlu diproses.',
      summary: { usersCreated: 0, usersExisting: 0, enrolmentsCount: 0 }
    }
  }

  // 3. Match Existing Users in Moodle (by username, email, & idnumber)
  const moodleUserMap: Record<string, number> = {}

  // Helper to chunk arrays for Moodle API calls (max 50 per batch)
  const chunkArray = <T>(arr: T[], size: number): T[][] => {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size))
    }
    return res
  }

  // Lookup by username
  const usernames = userList.map(u => u.username).filter(Boolean)
  for (const chunk of chunkArray(usernames, 50)) {
    try {
      const existing = await MoodleService.getUsersByField('username', chunk)
      if (Array.isArray(existing)) {
        for (const mu of existing) {
          if (mu && mu.id) {
            if (mu.username) moodleUserMap[mu.username.toLowerCase()] = mu.id
            if (mu.email) moodleUserMap[mu.email.toLowerCase()] = mu.id
            if (mu.idnumber) moodleUserMap[mu.idnumber] = mu.id
          }
        }
      }
    } catch (e) {
      console.warn('Lookup by username warning:', e)
    }
  }

  // Lookup by email
  const emails = userList.map(u => u.email).filter(Boolean)
  for (const chunk of chunkArray(emails, 50)) {
    try {
      const existing = await MoodleService.getUsersByField('email', chunk)
      if (Array.isArray(existing)) {
        for (const mu of existing) {
          if (mu && mu.id) {
            if (mu.username) moodleUserMap[mu.username.toLowerCase()] = mu.id
            if (mu.email) moodleUserMap[mu.email.toLowerCase()] = mu.id
            if (mu.idnumber) moodleUserMap[mu.idnumber] = mu.id
          }
        }
      }
    } catch (e) {
      console.warn('Lookup by email warning:', e)
    }
  }

  // Lookup by idnumber (NIS / NIP)
  const idnumbers = userList.map(u => u.nipOrNis).filter(n => n && n !== '-')
  for (const chunk of chunkArray(idnumbers, 50)) {
    try {
      const existing = await MoodleService.getUsersByField('idnumber', chunk)
      if (Array.isArray(existing)) {
        for (const mu of existing) {
          if (mu && mu.id) {
            if (mu.username) moodleUserMap[mu.username.toLowerCase()] = mu.id
            if (mu.email) moodleUserMap[mu.email.toLowerCase()] = mu.id
            if (mu.idnumber) moodleUserMap[mu.idnumber] = mu.id
          }
        }
      }
    } catch (e) {
      console.warn('Lookup by idnumber warning:', e)
    }
  }

  // 4. Create Missing Users in Moodle
  const usersToCreate: MoodleCreateUserParam[] = []

  for (const u of userList) {
    const existingId = moodleUserMap[u.username.toLowerCase()] || moodleUserMap[u.email.toLowerCase()] || moodleUserMap[u.nipOrNis]
    if (!existingId) {
      usersToCreate.push({
        username: u.username,
        password: u.initialPassword,
        firstname: u.firstname,
        lastname: u.lastname,
        email: u.email,
        auth: 'manual',
        idnumber: u.nipOrNis
      })
    }
  }

  let usersCreatedCount = 0

  if (usersToCreate.length > 0) {
    try {
      const createdRes = await MoodleService.createUsers(usersToCreate)
      if (Array.isArray(createdRes)) {
        for (const created of createdRes) {
          if (created && created.id) {
            if (created.username) moodleUserMap[created.username.toLowerCase()] = created.id
            usersCreatedCount++
          }
        }
      }
    } catch (err: any) {
      console.error('Gagal membuat user di Moodle (batch), mencoba per-user:', err)
      for (const uParam of usersToCreate) {
        try {
          const singleRes = await MoodleService.createUsers([uParam])
          if (Array.isArray(singleRes) && singleRes[0]?.id) {
            moodleUserMap[uParam.username.toLowerCase()] = singleRes[0].id
            usersCreatedCount++
          }
        } catch (singleErr) {
          console.error(`Gagal membuat user single [${uParam.username}]:`, singleErr)
        }
      }
    }
  }

  // Update DB user moodleUserId & sync Moodle usernames to NIS
  const existingUpdates: { id: number; username: string; idnumber: string; firstname: string; lastname: string }[] = []

  for (const u of userList) {
    const moodleId = moodleUserMap[u.username.toLowerCase()] || moodleUserMap[u.email.toLowerCase()] || moodleUserMap[u.nipOrNis]
    if (moodleId) {
      await prisma.user.update({
        where: { id: u.appUserId },
        data: { moodleUserId: moodleId }
      }).catch(() => {})

      existingUpdates.push({
        id: moodleId,
        username: u.username,
        idnumber: u.nipOrNis,
        firstname: u.firstname,
        lastname: u.lastname
      })
    }
  }

  // Execute Moodle username & idnumber sync (in batch chunks of 20)
  if (existingUpdates.length > 0) {
    for (const chunk of chunkArray(existingUpdates, 20)) {
      try {
        await MoodleService.updateUsers(chunk)
      } catch (e) {
        console.warn('Gagal batch update username Moodle existing:', e)
      }
    }
  }

  // 5. Auto-Enroll Users to Moodle Courses
  let enrolmentsCount = 0

  if (autoEnroll) {
    const enrolments: MoodleEnrolParam[] = []

    for (const u of userList) {
      const moodleUserId = moodleUserMap[u.username.toLowerCase()] || moodleUserMap[u.email.toLowerCase()] || moodleUserMap[u.nipOrNis]
      if (!moodleUserId) continue

      const roleid = u.type === 'TEACHER' ? 3 : 5

      for (const courseid of u.coursesToEnroll) {
        enrolments.push({
          roleid,
          userid: moodleUserId,
          courseid
        })
      }
    }

    if (enrolments.length > 0) {
      const chunks = chunkArray(enrolments, 20)
      for (const batch of chunks) {
        try {
          await MoodleService.enrolUsers(batch)
          enrolmentsCount += batch.length
        } catch (err: any) {
          console.error('Gagal batch enrolment ke Moodle, mencoba per-user:', err)
          for (const en of batch) {
            try {
              await MoodleService.enrolUsers([en])
              enrolmentsCount++
            } catch (e) {
              // Ignore single enrolment error
            }
          }
        }
      }
    }
  }

  // Save student password into DB if not saved yet
  for (const u of userList) {
    if (u.type === 'STUDENT') {
      await prisma.student.updateMany({
        where: { nis: u.nipOrNis },
        data: {
          moodlePassword: u.initialPassword,
          moodlePasswordMode: 'HARIAN'
        }
      })
    }
  }

  // 6. Log Sync Result
  await prisma.syncLog.create({
    data: {
      resource: 'USER',
      status: 'SUCCESS',
      message: `Ekspor & Enroll User: ${usersCreatedCount} User Baru, ${enrolmentsCount} Enrollment ke Course Moodle.`
    }
  })

  return {
    success: true,
    message: `Ekspor User Selesai: ${usersCreatedCount} Akun Baru Dibuat di Moodle, ${enrolmentsCount} Enrollment Course Berhasil.`,
    summary: {
      totalProcessed: userList.length,
      usersCreated: usersCreatedCount,
      usersExisting: userList.length - usersCreatedCount,
      enrolmentsCount
    }
  }
})
