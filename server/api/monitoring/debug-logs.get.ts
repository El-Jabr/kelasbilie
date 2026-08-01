import fs from 'node:fs'
import path from 'node:path'

export interface LogEntry {
  level?: string
  time?: string
  msg?: string
  message?: string
  type?: string
  path?: string
  statusCode?: number
  durationMs?: number
  url?: string
  [key: string]: any
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const levelFilter = (query.level as string) || 'all'
  const searchFilter = (query.search as string || '').toLowerCase()
  const limit = Number(query.limit) || 200

  const logFilePath = path.resolve(process.cwd(), 'logs', 'debug.log')

  if (!fs.existsSync(logFilePath)) {
    return {
      success: true,
      logs: [] as LogEntry[],
      total: 0
    }
  }

  try {
    const fileContent = await fs.promises.readFile(logFilePath, 'utf-8')
    const lines = fileContent.trim().split('\n')

    const parsedLogs: LogEntry[] = []

    for (let i = lines.length - 1; i >= 0; i--) {
      const rawLine = lines[i]
      if (!rawLine) continue
      const line = rawLine.trim()
      if (!line) continue

      try {
        const item = JSON.parse(line) as LogEntry

        let rawLevel = item.level || 'info'
        if (typeof rawLevel === 'number') {
          if (rawLevel >= 50) rawLevel = 'error'
          else if (rawLevel >= 40) rawLevel = 'warn'
          else rawLevel = 'info'
        }
        rawLevel = String(rawLevel).toLowerCase()
        if (rawLevel === 'warning') rawLevel = 'warn'

        // Filter by level
        if (levelFilter !== 'all' && rawLevel !== levelFilter.toLowerCase()) {
          continue
        }

        // Filter by search text
        if (searchFilter) {
          const logText = JSON.stringify(item).toLowerCase()
          if (!logText.includes(searchFilter)) {
            continue
          }
        }

        parsedLogs.push({
          ...item,
          level: rawLevel
        })

        if (parsedLogs.length >= limit) {
          break
        }
      } catch {
        // Skip lines that fail JSON parse
      }
    }

    return {
      success: true,
      logs: parsedLogs,
      total: parsedLogs.length
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal membaca file log: ${error.message}`
    })
  }
})
