import pino from 'pino'
import fs from 'node:fs'
import path from 'node:path'

const logDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const logFilePath = path.join(logDir, 'debug.log')

const fileDestination = pino.destination({
  dest: logFilePath,
  mkdir: true,
  sync: true
})

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toLowerCase() }
      }
    }
  },
  fileDestination
)
