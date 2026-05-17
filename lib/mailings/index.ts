/**
 * NetNext Email Mailing System
 * 
 * Anti-spam compliant email sending with:
 * - DKIM signing
 * - Rate limiting via BullMQ
 * - Unsubscribe handling
 * - PostgreSQL-based recipient tracking
 * 
 * Usage:
 * 1. Configure environment variables (see .env.example)
 * 2. Run migrations: npx tsx lib/db/migrate.ts
 * 3. Start worker: npx tsx lib/mailings/worker.ts
 * 4. Access admin panel: /admin/mailings
 */

export * from './config'
export * from './sender'
export * from './queue'
export * from './database'
