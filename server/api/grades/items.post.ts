import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody<{
    courseId: number
    name: string
    category?: 'PH' | 'STS' | 'SAS'
  }>(event)

  if (!body?.courseId || !body?.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Course ID dan Nama Item Nilai wajib diisi.'
    })
  }

  const course = await prisma.course.findUnique({
    where: { id: body.courseId },
    include: {
      teaching: {
        include: {
          subject: true,
          classroom: true
        }
      }
    }
  })

  if (!course) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mata pelajaran / Course tidak ditemukan.'
    })
  }

  const category = body.category || 'PH'
  const cleanName = body.name.trim()

  // Find min negative ID to avoid collisions for manual grade items
  const minItem = await prisma.gradeItem.findFirst({
    orderBy: { id: 'asc' }
  })

  let newId = -1
  if (minItem && minItem.id < 0) {
    newId = minItem.id - 1
  }

  const newItem = await prisma.gradeItem.create({
    data: {
      id: newId,
      courseId: body.courseId,
      name: cleanName,
      category: category,
      itemType: 'manual'
    }
  })

  const subjectName = course.teaching?.subject?.name || course.fullname
  const className = course.teaching?.classroom?.name ? ` (Kelas ${course.teaching.classroom.name})` : ''

  await prisma.syncLog.create({
    data: {
      resource: 'GRADE',
      status: 'SUCCESS',
      message: `Tambah Item Nilai Manual [${cleanName}] (${category}) - ${subjectName}${className} oleh ${user.fullname}`
    }
  })

  return {
    success: true,
    message: `Item Nilai [${cleanName}] berhasil ditambahkan.`,
    data: newItem
  }
})
