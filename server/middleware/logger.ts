import { logger } from '../utils/logger'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // Hanya log request ke /api
  if (!url.pathname.startsWith('/api')) {
    return
  }

  // Skip log endpoint monitoring sendiri untuk menghindari infinite loop
  if (
    url.pathname.startsWith('/api/monitoring/debug-logs') ||
    url.pathname.startsWith('/api/monitoring/client-log')
  ) {
    return
  }

  const method = event.method
  const startTime = Date.now()

  event.node.res.on('finish', () => {
    const statusCode = event.node.res.statusCode
    const duration = Date.now() - startTime

    const logPayload = {
      type: 'http',
      method,
      path: url.pathname,
      statusCode,
      durationMs: duration
    }

    const message = `[HTTP ${method}] ${url.pathname} - Status: ${statusCode} (${duration}ms)`

    if (statusCode >= 500) {
      logger.error(logPayload, message)
    } else if (statusCode >= 400) {
      logger.warn(logPayload, message)
    } else {
      logger.info(logPayload, message)
    }
  })
})
