import { logger } from '~~/server/utils/logger'

export default defineEventHandler(() => {
  logger.error(
    { reason: 'Simulasi error backend yang sengaja dipicu oleh admin' },
    'Test Error Backend Dipicu!'
  )

  throw createError({
    statusCode: 500,
    statusMessage: 'Simulasi Internal Server Error'
  })
})
