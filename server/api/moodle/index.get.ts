import { prisma } from '../../utils/db'

export default defineEventHandler(async () => {
  try {
    const setting = await prisma.schoolSetting.findFirst({
    })
    return setting
  } catch (error) {
    console.error('Error fetching setting field:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch setting field'
    })
  }
})
