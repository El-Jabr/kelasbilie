import fs from 'node:fs'
import path from 'node:path'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN'])

  const logFilePath = path.resolve(process.cwd(), 'logs', 'debug.log')

  try {
    const logDir = path.dirname(logFilePath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // Reset / clear log content by writing empty string
    await fs.promises.writeFile(logFilePath, '', 'utf-8')

    return {
      success: true,
      message: 'Log debug Pino berhasil di-reset / dibersihkan.'
    }
  } catch (error: any) {
    console.error('Error resetting log file:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal membersihkan file log: ${error.message}`
    })
  }
})
