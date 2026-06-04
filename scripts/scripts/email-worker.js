#!/usr/bin/env tsx
"use strict";
/**
 * Email Worker Process
 * Run this as a separate process to handle email queue processing
 *
 * Usage:
 *   npx tsx scripts/email-worker.ts
 *
 * Or via PM2:
 *   pm2 start "npx tsx scripts/email-worker.ts" --name "email-worker"
 */
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const queue_1 = require("../lib/mailings/queue");
console.log('========================================');
console.log('  NetNext Email Worker');
console.log('========================================');
console.log('');
// Validate required environment variables
const required = ['DATABASE_URL', 'REDIS_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('');
    console.error('Please check your .env file');
    process.exit(1);
}
console.log('Configuration:');
console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
console.log(`  SMTP User: ${process.env.SMTP_USER}`);
console.log(`  Redis URL: ${process.env.REDIS_URL?.replace(/:[^:@]+@/, ':***@')}`);
console.log('');
// Start worker
async function main() {
    try {
        console.log('Starting email worker...');
        await (0, queue_1.startEmailWorker)();
        console.log('Email worker started successfully!');
        console.log('');
        // Log queue stats periodically
        setInterval(async () => {
            try {
                const stats = await (0, queue_1.getQueueStats)();
                if (stats.waiting > 0 || stats.active > 0 || stats.failed > 0) {
                    console.log(`[${new Date().toISOString()}] Queue: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
                }
            }
            catch {
                // Ignore stats errors
            }
        }, 30000);
        console.log('Worker is running. Press Ctrl+C to stop.');
        console.log('');
    }
    catch (error) {
        console.error('Failed to start worker:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('');
    console.log('Shutting down gracefully...');
    await (0, queue_1.stopEmailWorker)();
    console.log('Worker stopped.');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    await (0, queue_1.stopEmailWorker)();
    process.exit(0);
});
main();
