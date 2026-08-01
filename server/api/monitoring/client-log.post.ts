import { logger } from '~~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { level = 'error', message, details } = body || {}

  const logPayload = {
    type: 'frontend',
    ...(details || {})
  }

  const logMessage = `[FRONTEND] ${message || 'Uncaught Client Error'}`

  if (level === 'warn' || level === 'warning') {
    logger.warn(logPayload, logMessage)
  } else if (level === 'info') {
    logger.info(logPayload, logMessage)
  } else {
    logger.error(logPayload, logMessage)
  }

  return { success: true }
})
