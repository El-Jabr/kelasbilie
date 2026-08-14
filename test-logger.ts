import { logger } from './server/utils/logger'

logger.info({ url: '/api/monitoring/test-error', method: 'POST' }, 'This is a test info log')
logger.warn('This is a warning log')
logger.error(new Error('This is a test error'), 'An error occurred during testing')

setTimeout(() => {
  console.log('Done writing logs.')
}, 500)
