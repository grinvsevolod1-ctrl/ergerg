/**
 * Email Sender with DKIM signing and anti-spam compliance
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { readFileSync, existsSync } from 'fs'
import { mailingConfig } from './config'
import { isEmailUnsubscribed, logMailingSend } from './database'

// DKIM private key (loaded once)
let dkimPrivateKey: string | null = null

function loadDkimKey(): string | null {
  if (dkimPrivateKey !== null) return dkimPrivateKey
  
  const keyPath = mailingConfig.dkim.privateKeyPath
  
  if (existsSync(keyPath)) {
    try {
      dkimPrivateKey = readFileSync(keyPath, 'utf-8')
      console.log('[Email] DKIM key loaded from', keyPath)
    } catch (error) {
      console.error('[Email] Failed to load DKIM key:', error)
      dkimPrivateKey = ''
    }
  } else {
    console.warn('[Email] DKIM key not found at', keyPath, '- emails will be sent without DKIM')
    dkimPrivateKey = ''
  }
  
  return dkimPrivateKey || null
}

// Transport options type for nodemailer with DKIM and pool support
interface PoolTransportOptions extends nodemailer.TransportOptions {
  pool?: boolean
  maxConnections?: number
  maxMessages?: number
  rateDelta?: number
  rateLimit?: number
  dkim?: {
    domainName: string
    keySelector: string
    privateKey: string
  }
}

// Create transporter
function createTransporter(): Transporter {
  const dkimKey = loadDkimKey()
  
  const transportOptions: PoolTransportOptions = {
    ...mailingConfig.smtp,
    pool: true, // Use connection pooling for bulk sending
    maxConnections: 1, // Single connection to avoid rate limits
    maxMessages: 10, // Messages per connection before reconnect
    rateDelta: mailingConfig.rateLimits.delayBetweenEmails,
    rateLimit: 1, // 1 message per rateDelta
  }

  // Add DKIM if key is available
  if (dkimKey) {
    transportOptions.dkim = {
      domainName: mailingConfig.dkim.domainName,
      keySelector: mailingConfig.dkim.selector,
      privateKey: dkimKey,
    }
  }

  return nodemailer.createTransport(transportOptions)
}

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = createTransporter()
  }
  return transporter
}

// Generate unsubscribe link with token
function generateUnsubscribeLink(email: string, campaignId: string): string {
  const token = Buffer.from(`${email}:${campaignId}:${Date.now()}`).toString('base64url')
  return `${mailingConfig.compliance.unsubscribeUrlBase}?token=${token}`
}

// Add required email headers for compliance
function getComplianceHeaders(email: string, campaignId: string) {
  const unsubscribeUrl = generateUnsubscribeLink(email, campaignId)
  
  return {
    // List-Unsubscribe header (required for bulk email)
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@netnext.site?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    // Precedence header
    'Precedence': 'bulk',
    // X-Mailer identification
    'X-Mailer': 'NetNext Mailing System',
  }
}

// Append compliance footer to HTML
function appendComplianceFooter(html: string, email: string, campaignId: string): string {
  const unsubscribeUrl = generateUnsubscribeLink(email, campaignId)
  
  const footer = `
    <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 0 0 10px 0;">
        Вы получили это письмо, потому что ваш email был добавлен в нашу рассылку.
      </p>
      <p style="margin: 0 0 10px 0;">
        <a href="${unsubscribeUrl}" style="color: #0066cc;">Отписаться от рассылки</a>
      </p>
      <p style="margin: 0; color: #999;">
        ${mailingConfig.compliance.companyAddress}
      </p>
    </div>
  `
  
  // Insert before closing body tag or append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${footer}</body>`)
  }
  return html + footer
}

// Main send function
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  campaignId: string
  recipientId: string
  recipientName?: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  skipped?: boolean
  skipReason?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const { to, subject, html, text, campaignId, recipientId, recipientName } = options

  try {
    // Check if email is unsubscribed
    const isUnsubscribed = await isEmailUnsubscribed(to)
    if (isUnsubscribed) {
      console.log(`[Email] Skipping unsubscribed email: ${to}`)
      return {
        success: false,
        skipped: true,
        skipReason: 'unsubscribed',
      }
    }

    // Prepare email with compliance headers and footer
    const compliantHtml = appendComplianceFooter(html, to, campaignId)
    const headers = getComplianceHeaders(to, campaignId)

    // Send email
    const transport = getTransporter()
    
    const result = await transport.sendMail({
      from: {
        name: mailingConfig.sender.name,
        address: mailingConfig.sender.email,
      },
      to: recipientName ? { name: recipientName, address: to } : to,
      subject,
      html: compliantHtml,
      text: text || stripHtml(html),
      headers,
    })

    // Log successful send
    await logMailingSend(campaignId, recipientId, 'sent', result.messageId)

    console.log(`[Email] Sent to ${to}, messageId: ${result.messageId}`)
    
    return {
      success: true,
      messageId: result.messageId,
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Log failed send
    await logMailingSend(campaignId, recipientId, 'failed', undefined, errorMessage)
    
    console.error(`[Email] Failed to send to ${to}:`, errorMessage)
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Simple HTML to text converter
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Verify transporter connection
export async function verifyConnection(): Promise<boolean> {
  try {
    const transport = getTransporter()
    await transport.verify()
    console.log('[Email] SMTP connection verified')
    return true
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error)
    return false
  }
}

// Close transporter (cleanup)
export function closeTransporter(): void {
  if (transporter) {
    transporter.close()
    transporter = null
  }
}
