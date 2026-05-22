/**
 * Production-ready logger utility
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
const isProduction = process.env.NODE_ENV === 'production'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify(entry)
  }
  // Pretty format for development
  const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
  return `${prefix} ${entry.message}${dataStr}`
}

function createLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    if (shouldLog('debug')) {
      console.debug(formatLog(createLogEntry('debug', message, data)))
    }
  },

  info(message: string, data?: Record<string, unknown>) {
    if (shouldLog('info')) {
      console.info(formatLog(createLogEntry('info', message, data)))
    }
  },

  warn(message: string, data?: Record<string, unknown>) {
    if (shouldLog('warn')) {
      console.warn(formatLog(createLogEntry('warn', message, data)))
    }
  },

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    if (shouldLog('error')) {
      const errorData = error instanceof Error 
        ? { errorMessage: error.message, stack: error.stack, ...data }
        : { error, ...data }
      console.error(formatLog(createLogEntry('error', message, errorData)))
    }
  },

  // For API routes - logs request info
  request(method: string, path: string, data?: Record<string, unknown>) {
    this.info(`${method} ${path}`, data)
  },

  // For performance tracking
  time(label: string) {
    if (!isProduction) {
      console.time(label)
    }
  },

  timeEnd(label: string) {
    if (!isProduction) {
      console.timeEnd(label)
    }
  },
}

export default logger
