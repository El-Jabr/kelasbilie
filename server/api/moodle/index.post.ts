import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ schoolName: string, url: string, token: string, syncEnabled: boolean, syncInterval: number }>(event)
    if (!body.url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Url is required'
      })
    }
    const setting = await prisma.schoolSetting.create({
      data: {
        schoolName: body.schoolName,
        moodleUrl: body.url,
        moodleToken: body.token,
        syncEnabled: body.syncEnabled,
        syncInterval: body.syncInterval
      }
    })
    return setting
  } catch (error) {
    console.error('Error saving url moodle:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save url moodle'
    })
  }
})
