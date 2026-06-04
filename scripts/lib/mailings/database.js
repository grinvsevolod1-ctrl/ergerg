"use strict";
/**
 * Mailing system database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaign = createCampaign;
exports.getCampaign = getCampaign;
exports.getCampaigns = getCampaigns;
exports.updateCampaignStatus = updateCampaignStatus;
exports.updateCampaignCounts = updateCampaignCounts;
exports.deleteCampaign = deleteCampaign;
exports.addRecipients = addRecipients;
exports.getRecipients = getRecipients;
exports.getPendingRecipients = getPendingRecipients;
exports.updateRecipientStatus = updateRecipientStatus;
exports.logMailingSend = logMailingSend;
exports.isEmailUnsubscribed = isEmailUnsubscribed;
exports.unsubscribeEmail = unsubscribeEmail;
exports.getUnsubscribedEmails = getUnsubscribedEmails;
exports.createTemplate = createTemplate;
exports.getTemplates = getTemplates;
exports.getTemplate = getTemplate;
exports.updateTemplate = updateTemplate;
exports.deleteTemplate = deleteTemplate;
const db_1 = require("@/lib/db");
// === Campaigns ===
async function createCampaign(name, subject, htmlContent, textContent) {
    const result = await (0, db_1.query)(`INSERT INTO mailing_campaigns (name, subject, html_content, text_content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [name, subject, htmlContent, textContent || null]);
    return result[0];
}
async function getCampaign(id) {
    return (0, db_1.queryOne)('SELECT * FROM mailing_campaigns WHERE id = $1', [id]);
}
async function getCampaigns(status, limit = 50) {
    if (status) {
        return (0, db_1.query)('SELECT * FROM mailing_campaigns WHERE status = $1 ORDER BY created_at DESC LIMIT $2', [status, limit]);
    }
    return (0, db_1.query)('SELECT * FROM mailing_campaigns ORDER BY created_at DESC LIMIT $1', [limit]);
}
async function updateCampaignStatus(id, status, additionalFields) {
    let sql = 'UPDATE mailing_campaigns SET status = $1, updated_at = NOW()';
    const params = [status];
    if (additionalFields?.started_at) {
        sql += ', started_at = NOW()';
    }
    if (additionalFields?.completed_at) {
        sql += ', completed_at = NOW()';
    }
    sql += ' WHERE id = $' + (params.length + 1);
    params.push(id);
    await (0, db_1.execute)(sql, params);
}
async function updateCampaignCounts(id) {
    await (0, db_1.execute)(`UPDATE mailing_campaigns SET
       total_recipients = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1),
       sent_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status IN ('sent', 'opened', 'clicked')),
       failed_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status = 'failed'),
       opened_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status IN ('opened', 'clicked')),
       clicked_count = (SELECT COUNT(*) FROM mailing_recipients WHERE campaign_id = $1 AND status = 'clicked'),
       updated_at = NOW()
     WHERE id = $1`, [id]);
}
async function deleteCampaign(id) {
    // Recipients are deleted via CASCADE
    await (0, db_1.execute)('DELETE FROM mailing_campaigns WHERE id = $1', [id]);
}
// === Recipients ===
async function addRecipients(campaignId, recipients) {
    if (recipients.length === 0)
        return 0;
    // Filter out duplicates and unsubscribed
    const values = [];
    const params = [campaignId];
    let paramIndex = 2;
    for (const r of recipients) {
        values.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
        params.push(r.email, r.name || null, r.company || null, JSON.stringify(r.metadata || {}));
        paramIndex += 4;
    }
    const result = await (0, db_1.execute)(`INSERT INTO mailing_recipients (campaign_id, email, name, company, metadata)
     VALUES ${values.join(', ')}
     ON CONFLICT DO NOTHING`, params);
    // Update campaign total
    await updateCampaignCounts(campaignId);
    return result;
}
async function getRecipients(campaignId, status, limit = 100, offset = 0) {
    if (status) {
        return (0, db_1.query)('SELECT * FROM mailing_recipients WHERE campaign_id = $1 AND status = $2 ORDER BY id LIMIT $3 OFFSET $4', [campaignId, status, limit, offset]);
    }
    return (0, db_1.query)('SELECT * FROM mailing_recipients WHERE campaign_id = $1 ORDER BY id LIMIT $2 OFFSET $3', [campaignId, limit, offset]);
}
async function getPendingRecipients(campaignId, limit = 10) {
    return (0, db_1.query)(`SELECT * FROM mailing_recipients 
     WHERE campaign_id = $1 AND status = 'pending'
     ORDER BY id LIMIT $2`, [campaignId, limit]);
}
async function updateRecipientStatus(recipientId, status, error) {
    let sql = 'UPDATE mailing_recipients SET status = $1';
    const params = [status];
    if (status === 'sent') {
        sql += ', sent_at = NOW()';
    }
    else if (status === 'opened') {
        sql += ', opened_at = NOW()';
    }
    else if (status === 'clicked') {
        sql += ', clicked_at = NOW()';
    }
    if (error) {
        sql += ', error_message = $' + (params.length + 1);
        params.push(error);
    }
    sql += ' WHERE id = $' + (params.length + 1);
    params.push(recipientId);
    await (0, db_1.execute)(sql, params);
}
// === Logging ===
async function logMailingSend(campaignId, recipientId, status, messageId, error) {
    if (status === 'sent') {
        await updateRecipientStatus(recipientId, 'sent');
    }
    else {
        await updateRecipientStatus(recipientId, 'failed', error);
    }
    // Update campaign counts
    await updateCampaignCounts(campaignId);
}
// === Unsubscribes ===
async function isEmailUnsubscribed(email) {
    const result = await (0, db_1.queryOne)('SELECT email FROM email_unsubscribes WHERE email = $1', [email.toLowerCase()]);
    return result !== null;
}
async function unsubscribeEmail(email, reason) {
    await (0, db_1.execute)(`INSERT INTO email_unsubscribes (email, reason)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`, [email.toLowerCase(), reason || 'user_request']);
}
async function getUnsubscribedEmails(limit = 100) {
    const result = await (0, db_1.query)('SELECT email FROM email_unsubscribes ORDER BY unsubscribed_at DESC LIMIT $1', [limit]);
    return result.map(r => r.email);
}
// === Templates ===
async function createTemplate(name, subject, htmlContent, textContent, variables) {
    const result = await (0, db_1.query)(`INSERT INTO email_templates (name, subject, html_content, text_content, variables)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, [name, subject, htmlContent, textContent || null, JSON.stringify(variables || [])]);
    return result[0];
}
async function getTemplates() {
    return (0, db_1.query)('SELECT * FROM email_templates ORDER BY updated_at DESC');
}
async function getTemplate(id) {
    return (0, db_1.queryOne)('SELECT * FROM email_templates WHERE id = $1', [id]);
}
async function updateTemplate(id, updates) {
    const setClauses = ['updated_at = NOW()'];
    const params = [];
    if (updates.name !== undefined) {
        params.push(updates.name);
        setClauses.push(`name = $${params.length}`);
    }
    if (updates.subject !== undefined) {
        params.push(updates.subject);
        setClauses.push(`subject = $${params.length}`);
    }
    if (updates.html_content !== undefined) {
        params.push(updates.html_content);
        setClauses.push(`html_content = $${params.length}`);
    }
    if (updates.text_content !== undefined) {
        params.push(updates.text_content);
        setClauses.push(`text_content = $${params.length}`);
    }
    if (updates.variables !== undefined) {
        params.push(JSON.stringify(updates.variables));
        setClauses.push(`variables = $${params.length}`);
    }
    params.push(id);
    await (0, db_1.execute)(`UPDATE email_templates SET ${setClauses.join(', ')} WHERE id = $${params.length}`, params);
}
async function deleteTemplate(id) {
    await (0, db_1.execute)('DELETE FROM email_templates WHERE id = $1', [id]);
}
