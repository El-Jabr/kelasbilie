import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Hanya SUPER_ADMIN & ADMIN yang bisa melihat pengaturan sekolah
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  try {
    let setting = await prisma.schoolSetting.findFirst()

    // Jika belum ada record setting, buatkan default record
    if (!setting) {
      setting = await prisma.schoolSetting.create({
        data: {
          schoolName: 'Kelasbilie School',
          syncEnabled: true,
          syncInterval: 30
        }
      })
    }

    return {
      status: 'success',
      data: setting
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching school settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengambil data pengaturan sekolah.'
    })
  }
})
