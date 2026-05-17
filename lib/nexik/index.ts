/**
 * Nexik - AI Chat Platform
 * Production-ready multi-tenant SaaS
 */

// Database modules
export * from './db/schema'
export * from './db/organizations'
export * from './db/widgets'
export * from './db/conversations'
export * from './db/knowledge'

// Services
export * from './services/auth'
export * from './services/chat'

// Version
export const NEXIK_VERSION = '2.0.0'
