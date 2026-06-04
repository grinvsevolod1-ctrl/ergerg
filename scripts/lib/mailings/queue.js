"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailQueue = getEmailQueue;
exports.startEmailWorker = startEmailWorker;
exports.stopEmailWorker = stopEmailWorker;
exports.getQueueStats = getQueueStats;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const sender_1 = require("./sender");
const database_1 = require("./database");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
function getRedisConnection() {
    return new ioredis_1.default(REDIS_URL, {
        maxRetriesPerRequest: null,
    });
}
let emailQueue = null;
function getEmailQueue() {
    if (!emailQueue) {
        emailQueue = new bullmq_1.Queue('email-queue', {
            connection: getRedisConnection(),
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 500,
                attempts: 3,
                backoff: { type: 'exponential', delay: 30000 },
            },
        });
    }
    return emailQueue;
}
async function startEmailWorker() {
    const worker = new bullmq_1.Worker('email-queue', async (job) => {
        const { campaignId, recipient } = job.data;
        const campaign = await (0, database_1.getCampaign)(campaignId);
        if (!campaign)
            throw new Error('Campaign not found');
        await (0, sender_1.sendEmail)({
            to: recipient.email,
            subject: campaign.subject,
            html: campaign.html_content,
            text: campaign.text_content,
        });
        await (0, database_1.updateCampaignCounts)(campaignId, 'sent', 1);
    }, { connection: getRedisConnection() });
    worker.on('error', (err) => console.error('Worker error:', err));
    return worker;
}
async function stopEmailWorker(worker) {
    await worker.close();
}
async function getQueueStats() {
    const queue = getEmailQueue();
    const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
}
