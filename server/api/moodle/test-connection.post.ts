import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN'])

  const body = await readBody<{ moodleUrl?: string, moodleToken?: string }>(event)

  if (body?.moodleUrl && body?.moodleToken) {
    const baseUrl = body.moodleUrl.replace(/\/+$/, '')
    const endpoint = `${baseUrl}/webservice/rest/server.php`

    const queryParams = new URLSearchParams({
      wstoken: body.moodleToken,
      wsfunction: 'core_course_get_categories',
      moodlewsrestformat: 'json'
    })

    try {
      const response: any = await $fetch(`${endpoint}?${queryParams.toString()}`)
      if (response && response.exception) {
        throw new Error(`Moodle Error [${response.errorcode}]: ${response.message}`)
      }
      return {
        success: true,
        message: 'Koneksi ke Moodle API Berhasil!',
        categoryCount: Array.isArray(response) ? response.length : 0
      }
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        statusMessage: err.message || 'Gagal terhubung ke Moodle API.'
      })
    }
  } else {
    try {
      const categories = await MoodleService.getCategories()
      return {
        success: true,
        message: 'Koneksi ke Moodle API Berhasil!',
        categoryCount: categories.length
      }
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        statusMessage: err.statusMessage || err.message || 'Gagal terhubung ke Moodle API.'
      })
    }
  }
})
