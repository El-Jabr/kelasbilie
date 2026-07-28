import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

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

export default defineEventHandler(async (event: any) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const query = (getQuery(event as any) || {}) as any
  const classroomId = query.classroomId && query.classroomId !== 'ALL' ? String(query.classroomId).trim() : undefined

  const activeSemester = await prisma.semester.findFirst({
    where: { isActive: true }
  })

  const students = await prisma.student.findMany({
    where: {
      ...(classroomId && activeSemester && {
        classes: {
          some: {
            classroomId,
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
    },
    orderBy: {
      user: { fullname: 'asc' }
    }
  })

  const rows: string[] = [
    'NIS,Nama Siswa,Kelas,Username Moodle,Password Moodle,Mode Password'
  ]

  for (const s of students) {
    const nis = `"${(s.nis || '-').replace(/"/g, '""')}"`
    const nama = `"${(s.user?.fullname || '-').replace(/"/g, '""')}"`
    const classroomName = `"${(s.classes[0]?.classroom?.name || 'Belum Ada Kelas').replace(/"/g, '""')}"`
    const username = `"${sanitizeUsername(s.nis || s.user?.username, s.user?.email)}"`

    const fallbackPass = `Bilie#${s.nis || '12345'}`
    const password = `"${(s.moodlePassword || fallbackPass).replace(/"/g, '""')}"`
    const mode = `"${s.moodlePasswordMode || 'HARIAN'}"`

    rows.push(`${nis},${nama},${classroomName},${username},${password},${mode}`)
  }

  const csvContent = rows.join('\r\n')
  const filename = `Kredensial_Moodle_Siswa_${new Date().toISOString().slice(0, 10)}.csv`

  setHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`
  })

  return csvContent
})
