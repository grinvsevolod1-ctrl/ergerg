import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface HealthCheck {
  status: 'ok' | 'error' | 'warning'
  latencyMs?: number
  error?: string
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: HealthCheck
    memory: HealthCheck & { usedMB?: number; percentUsed?: number }
  }
}

const startTime = Date.now()

export async function GET() {
  const requestStart = Date.now()
  
  const checks: HealthStatus['checks'] = {
    database: { status: 'error' },
    memory: { status: 'ok' },
  }

  // Database check with latency measurement
  try {
    const dbStart = Date.now()
    await query('SELECT 1')
    checks.database = {
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }

  // Memory check
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage()
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024)
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024)
    const percentUsed = totalMB > 0 ? Math.round((usedMB / totalMB) * 100) : 0
    
    checks.memory = {
      status: percentUsed > 90 ? 'warning' : 'ok',
      usedMB,
      percentUsed,
    }
  }

  // Determine overall status
  let status: HealthStatus['status'] = 'healthy'
  if (checks.database.status === 'error') {
    status = 'unhealthy'
  } else if (checks.memory.status === 'warning') {
    status = 'degraded'
  }

  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  }

  return NextResponse.json(response, {
    status: status === 'unhealthy' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - requestStart}ms`,
    },
  })
}
