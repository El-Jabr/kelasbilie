import { prisma } from '../../utils/db'
import { requireRole } from '../../utils/auth'
import { updateSettingSchema } from '../../../shared/schemas/setting'

export default defineEventHandler(async (event) => {
  // Hanya SUPER_ADMIN yang diizinkan memperbarui pengaturan Moodle & Sekolah
  requireRole(event, ['SUPER_ADMIN'])

  try {
    const body = await readBody(event)
    const parsed = updateSettingSchema.safeParse(body)

    if (!parsed.success) {
      throw createError({
        statusCode: 400,
        statusMessage: parsed.error.issues[0]?.message || 'Data tidak valid.'
      })
    }

    let setting = await prisma.schoolSetting.findFirst()

    if (!setting) {
      setting = await prisma.schoolSetting.create({
        data: {
          schoolName: parsed.data.schoolName ?? 'Kelasbilie School',
          moodleUrl: parsed.data.moodleUrl || null,
          moodleToken: parsed.data.moodleToken || null,
          syncEnabled: parsed.data.syncEnabled ?? true,
          syncInterval: parsed.data.syncInterval ?? 30,
          logo: parsed.data.logo || null
        }
      })
    } else {
      setting = await prisma.schoolSetting.update({
        where: { id: setting.id },
        data: {
          ...(parsed.data.schoolName !== undefined && { schoolName: parsed.data.schoolName }),
          ...(parsed.data.moodleUrl !== undefined && { moodleUrl: parsed.data.moodleUrl || null }),
          ...(parsed.data.moodleToken !== undefined && { moodleToken: parsed.data.moodleToken || null }),
          ...(parsed.data.syncEnabled !== undefined && { syncEnabled: parsed.data.syncEnabled }),
          ...(parsed.data.syncInterval !== undefined && { syncInterval: parsed.data.syncInterval }),
          ...(parsed.data.logo !== undefined && { logo: parsed.data.logo || null })
        }
      })
    }

    return {
      status: 'success',
      message: 'Pengaturan sekolah berhasil diperbarui.',
      data: setting
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating school settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal memperbarui data pengaturan sekolah.'
    })
  }
})
