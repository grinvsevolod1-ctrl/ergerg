/**
 * Mailing system database operations
 */

import { query, queryOne, execute } from '@/lib/db'

// Types
export interface MailingCampaign {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed'
  total_recipients: number
  sent_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
  scheduled_at?: Date
  started_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface MailingRecipient {
  id: string
  campaign_id: string
  email: string
  name?: string
  company?: string
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced'
  sent_at?: Date
  opened_at?: Date
  clicked_at?: Date
  error_message?: string
  metadata: Record<string, unknown>
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables: string[]
  created_at: Date
  updated_at: Date
}

// === Campaigns ===

export async function createCampaign(
  name: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<MailingCampaign> {
  const result = await query<MailingCampaign>(
    `INSERT INTO mailing_campaigns (name, subject, html_content, text_content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, subject, htmlContent, textContent || null]
  )
  return result[0]
}

export async function getCampaign(id: string): Promise<MailingCampaign | null> {
  return queryOne<MailingCampaign>(
    'SELECT * FROM mailing_campaigns WHERE id = $1',
    [id]
  )
}

export async function getCampaigns(
  status?: string,
  limit = 50
): Promise<MailingCampaign[]> {
  if (status) {
    return query<MailingCampaign>(
      'SELECT * FROM mailing_campaigns WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
      [status, limit]
    )
  }
  return query<MailingCampaign>(
    'SELECT * FROM mailing_campaigns ORDER BY created_at DESC LIMIT $1',
    [limit]
  )
}

export async function updateCampaignStatus(
  id: string,
  status: MailingCampaign['status'],
  additionalFields?: Partial<Pick<MailingCampaign, 'started_at' | 'completed_at'>>
): Promise<void> {
  let sql = 'UPDATE mailing_campaigns SET status = $1, updated_at = NOW()'
  const params: unknown[] = [status]

  if (additionalFields?.started_at) {
    sql += ', started_at = NOW()'
  }
  if (additionalFields?.completed_at) {
    sql += ', completed_at = NOW()'
  }

  sql += ' WHERE id = $' + (params.length + 1)
  params.push(id)

  await execute(sql, params)
}

export async function updateCampaignCounts(id: string): Promise<void> {
  await execute(
    `UPDATE mailing_campaigns SET
       total_recipients = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1),
       sent_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status IN ('sent', 'opened', 'clicked')),
       failed_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status = 'failed'),
       opened_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status IN ('opened', 'clicked')),
       clicked_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status = 'clicked'),
       updated_at = NOW()
     WHERE id = $1`,
    [id]
  )
}

export async function deleteCampaign(id: string): Promise<void> {
  // Recipients are deleted via CASCADE
  await execute('DELETE FROM mailing_campaigns WHERE id = $1', [id])
}

// === Recipients ===

export async function addRecipients(
  campaignId: string,
  recipients: Array<{ email: string; name?: string; company?: string; metadata?: Record<string, unknown> }>
): Promise<number> {
  if (recipients.length === 0) return 0

  // Filter out duplicates and unsubscribed
  const values: string[] = []
  const params: unknown[] = [campaignId]
  let paramIndex = 2

  for (const r of recipients) {
    values.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`)
    params.push(r.email, r.name || null, r.company || null, JSON.stringify(r.metadata || {}))
    paramIndex += 4
  }

  const result = await execute(
    `INSERT INTO mailing_recipients (campaign_id, email, name, company, metadata)
     VALUES ${values.join(', ')}
     ON CONFLICT DO NOTHING`,
    params
  )

  // Update campaign total
  await updateCampaignCounts(campaignId)

  return result
}

export async function getRecipients(
  campaignId: string,
  status?: string,
  limit = 100,
  offset = 0
): Promise<MailingRecipient[]> {
  if (status) {
    return query<MailingRecipient>(
      'SELECT * FROM mailing_recipients WHERE campaign_id = $1 AND status = $2 ORDER BY id LIMIT $3 OFFSET $4',
      [campaignId, status, limit, offset]
    )
  }
  return query<MailingRecipient>(
    'SELECT * FROM mailing_recipients WHERE campaign_id = $1 ORDER BY id LIMIT $2 OFFSET $3',
    [campaignId, limit, offset]
  )
}

export async function getPendingRecipients(
  campaignId: string,
  limit = 10
): Promise<MailingRecipient[]> {
  return query<MailingRecipient>(
    `SELECT * FROM mailing_recipients 
     WHERE campaign_id = $1 AND status = 'pending'
     ORDER BY id LIMIT $2`,
    [campaignId, limit]
  )
}

export async function updateRecipientStatus(
  recipientId: string,
  status: MailingRecipient['status'],
  error?: string
): Promise<void> {
  let sql = 'UPDATE mailing_recipients SET status = $1'
  const params: unknown[] = [status]

  if (status === 'sent') {
    sql += ', sent_at = NOW()'
  } else if (status === 'opened') {
    sql += ', opened_at = NOW()'
  } else if (status === 'clicked') {
    sql += ', clicked_at = NOW()'
  }

  if (error) {
    sql += ', error_message = $' + (params.length + 1)
    params.push(error)
  }

  sql += ' WHERE id = $' + (params.length + 1)
  params.push(recipientId)

  await execute(sql, params)
}

// === Logging ===

export async function logMailingSend(
  campaignId: string,
  recipientId: string,
  status: 'sent' | 'failed',
  messageId?: string,
  error?: string
): Promise<void> {
  if (status === 'sent') {
    await updateRecipientStatus(recipientId, 'sent')
  } else {
    await updateRecipientStatus(recipientId, 'failed', error)
  }
  
  // Update campaign counts
  await updateCampaignCounts(campaignId)
}

// === Unsubscribes ===

export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const result = await queryOne<{ email: string }>(
    'SELECT email FROM email_unsubscribes WHERE email = $1',
    [email.toLowerCase()]
  )
  return result !== null
}

export async function unsubscribeEmail(email: string, reason?: string): Promise<void> {
  await execute(
    `INSERT INTO email_unsubscribes (email, reason)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [email.toLowerCase(), reason || 'user_request']
  )
}

export async function getUnsubscribedEmails(limit = 100): Promise<string[]> {
  const result = await query<{ email: string }>(
    'SELECT email FROM email_unsubscribes ORDER BY unsubscribed_at DESC LIMIT $1',
    [limit]
  )
  return result.map(r => r.email)
}

// === Templates ===

export async function createTemplate(
  name: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
  variables?: string[]
): Promise<EmailTemplate> {
  const result = await query<EmailTemplate>(
    `INSERT INTO email_templates (name, subject, html_content, text_content, variables)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, subject, htmlContent, textContent || null, JSON.stringify(variables || [])]
  )
  return result[0]
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  return query<EmailTemplate>(
    'SELECT * FROM email_templates ORDER BY updated_at DESC'
  )
}

export async function getTemplate(id: string): Promise<EmailTemplate | null> {
  return queryOne<EmailTemplate>(
    'SELECT * FROM email_templates WHERE id = $1',
    [id]
  )
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'html_content' | 'text_content' | 'variables'>>
): Promise<void> {
  const setClauses: string[] = ['updated_at = NOW()']
  const params: unknown[] = []

  if (updates.name !== undefined) {
    params.push(updates.name)
    setClauses.push(`name = $${params.length}`)
  }
  if (updates.subject !== undefined) {
    params.push(updates.subject)
    setClauses.push(`subject = $${params.length}`)
  }
  if (updates.html_content !== undefined) {
    params.push(updates.html_content)
    setClauses.push(`html_content = $${params.length}`)
  }
  if (updates.text_content !== undefined) {
    params.push(updates.text_content)
    setClauses.push(`text_content = $${params.length}`)
  }
  if (updates.variables !== undefined) {
    params.push(JSON.stringify(updates.variables))
    setClauses.push(`variables = $${params.length}`)
  }

  params.push(id)

  await execute(
    `UPDATE email_templates SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
    params
  )
}

export async function deleteTemplate(id: string): Promise<void> {
  await execute('DELETE FROM email_templates WHERE id = $1', [id])
}
