/**
 * Email Queue using BullMQ
 * Handles rate-limited sending of bulk emails
 */

import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { mailingConfig } from './config'
import { sendEmail, type SendEmailOptions } from './sender'
import {
  getCampaign,
  getPendingRecipients,
  updateCampaignStatus,
  updateCampaignCounts,
} from './database'

// Redis connection
let connection: IORedis | null = null

function getRedisConnection(): IORedis {
  if (!connection) {
    const redisUrl = mailingConfig.queue.redis.url
    if (!redisUrl) {
      throw new Error('REDIS_URL is required for email queue')
    }
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
    })
  }
  return connection
}

// Queue instance
let emailQueue: Queue | null = null

export function getEmailQueue(): Queue {
  if (!emailQueue) {
    emailQueue = new Queue(mailingConfig.queue.name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
        attempts: 3, // Retry failed emails up to 3 times
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds initial delay
        },
      },
    })
  }
  return emailQueue
}

// Job types
interface SendEmailJob {
  type: 'send_email'
  campaignId: string
  recipientId: string
  email: string
  name?: string
  subject: string
  html: string
  text?: string
}

interface ProcessCampaignJob {
  type: 'process_campaign'
  campaignId: string
}

type EmailJobData = SendEmailJob | ProcessCampaignJob

// Add jobs to queue
export async function queueCampaignProcessing(campaignId: string): Promise<void> {
  const queue = getEmailQueue()
  
  await queue.add('process_campaign', {
    type: 'process_campaign',
    campaignId,
  } as ProcessCampaignJob)
  
  console.log(`[Queue] Campaign ${campaignId} queued for processing`)
}

export async function queueEmailSend(options: {
  campaignId: string
  recipientId: string
  email: string
  name?: string
  subject: string
  html: string
  text?: string
}): Promise<void> {
  const queue = getEmailQueue()
  
  await queue.add('send_email', {
    type: 'send_email',
    ...options,
  } as SendEmailJob, {
    // Rate limiting: delay based on queue position
    delay: mailingConfig.rateLimits.delayBetweenEmails,
  })
}

// Worker to process jobs
let worker: Worker | null = null

export function startEmailWorker(): Worker {
  if (worker) {
    return worker
  }

  worker = new Worker(
    mailingConfig.queue.name,
    async (job: Job<EmailJobData>) => {
      const data = job.data

      if (data.type === 'process_campaign') {
        await processCampaign(data.campaignId)
      } else if (data.type === 'send_email') {
        await processEmailSend(data)
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: mailingConfig.rateLimits.maxConcurrency,
      limiter: {
        max: mailingConfig.rateLimits.maxPerHour,
        duration: 3600000, // 1 hour in ms
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error)
  })

  console.log('[Worker] Email worker started')
  return worker
}

export async function stopEmailWorker(): Promise<void> {
  if (worker) {
    await worker.close()
    worker = null
    console.log('[Worker] Email worker stopped')
  }
}

// Process a campaign (batch send)
async function processCampaign(campaignId: string): Promise<void> {
  const campaign = await getCampaign(campaignId)
  
  if (!campaign) {
    console.error(`[Queue] Campaign ${campaignId} not found`)
    return
  }

  if (campaign.status !== 'sending') {
    // Update status to sending
    await updateCampaignStatus(campaignId, 'sending', { started_at: new Date() })
  }

  // Get pending recipients in batches
  const batchSize = 50
  let hasMore = true

  while (hasMore) {
    const recipients = await getPendingRecipients(campaignId, batchSize)
    
    if (recipients.length === 0) {
      hasMore = false
      break
    }

    // Queue each email
    for (const recipient of recipients) {
      await queueEmailSend({
        campaignId,
        recipientId: recipient.id,
        email: recipient.email,
        name: recipient.name,
        subject: campaign.subject,
        html: campaign.html_content,
        text: campaign.text_content,
      })
    }

    // If we got less than batch size, we're done
    if (recipients.length < batchSize) {
      hasMore = false
    }
  }

  // Check if all done
  const remaining = await getPendingRecipients(campaignId, 1)
  if (remaining.length === 0) {
    await updateCampaignStatus(campaignId, 'completed', { completed_at: new Date() })
    console.log(`[Queue] Campaign ${campaignId} completed`)
  }
}

// Process single email send
async function processEmailSend(job: SendEmailJob): Promise<void> {
  const result = await sendEmail({
    to: job.email,
    subject: job.subject,
    html: job.html,
    text: job.text,
    campaignId: job.campaignId,
    recipientId: job.recipientId,
    recipientName: job.name,
  })

  if (!result.success && !result.skipped) {
    // Throw to trigger retry
    throw new Error(result.error || 'Send failed')
  }

  // Update counts
  await updateCampaignCounts(job.campaignId)
}

// Queue stats
export async function getQueueStats(): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}> {
  const queue = getEmailQueue()
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return { waiting, active, completed, failed, delayed }
}

// Cleanup
export async function closeQueue(): Promise<void> {
  await stopEmailWorker()
  
  if (emailQueue) {
    await emailQueue.close()
    emailQueue = null
  }
  
  if (connection) {
    connection.disconnect()
    connection = null
  }
  
  console.log('[Queue] Queue closed')
}
