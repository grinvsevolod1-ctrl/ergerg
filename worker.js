const { Worker } = require('bullmq');
const Redis = require('ioredis');
const nodemailer = require('nodemailer');
const fs = require('fs');

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

let dkimPrivateKey = process.env.DKIM_PRIVATE_KEY || null;
if (!dkimPrivateKey && process.env.DKIM_PRIVATE_KEY_PATH) {
  try {
    dkimPrivateKey = fs.readFileSync(process.env.DKIM_PRIVATE_KEY_PATH, 'utf8');
    console.log('[Worker] DKIM key loaded from file');
  } catch (e) {
    console.error('[Worker] Failed to load DKIM key:', e.message);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mail.ru',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'hello@netnext.site',
    pass: process.env.SMTP_PASS || '8nJPG68mDgr73Kk1Ui1L'
  }
});

const worker = new Worker('mailing', async (job) => {
  console.log(`[Worker] Processing job ${job.id} for ${job.data.to}`);
  
  const { to, subject, html } = job.data;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'hello@netnext.site',
    to,
    subject,
    html,
  };
  
  if (dkimPrivateKey) {
    mailOptions.dkim = {
      domainName: process.env.DKIM_DOMAIN || 'netnext.site',
      keySelector: process.env.DKIM_SELECTOR || 'vps',
      privateKey: dkimPrivateKey
    };
  }
  
  await transporter.sendMail(mailOptions);
  console.log(`[Worker] Email sent to ${to}`);
}, { connection });

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] Started, waiting for jobs...');
