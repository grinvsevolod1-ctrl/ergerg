"use strict";
/**
 * Email Sender with DKIM signing and anti-spam compliance
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.verifyConnection = verifyConnection;
exports.closeTransporter = closeTransporter;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = require("fs");
const config_1 = require("./config");
const database_1 = require("./database");
// DKIM private key (loaded once)
let dkimPrivateKey = null;
function loadDkimKey() {
    if (dkimPrivateKey !== null)
        return dkimPrivateKey;
    const keyPath = config_1.mailingConfig.dkim.privateKeyPath;
    if ((0, fs_1.existsSync)(keyPath)) {
        try {
            dkimPrivateKey = (0, fs_1.readFileSync)(keyPath, 'utf-8');
            console.log('[Email] DKIM key loaded from', keyPath);
        }
        catch (error) {
            console.error('[Email] Failed to load DKIM key:', error);
            dkimPrivateKey = '';
        }
    }
    else {
        console.warn('[Email] DKIM key not found at', keyPath, '- emails will be sent without DKIM');
        dkimPrivateKey = '';
    }
    return dkimPrivateKey || null;
}
// Create transporter
function createTransporter() {
    const dkimKey = loadDkimKey();
    const transportOptions = {
        ...config_1.mailingConfig.smtp,
        pool: true, // Use connection pooling for bulk sending
        maxConnections: 1, // Single connection to avoid rate limits
        maxMessages: 10, // Messages per connection before reconnect
        rateDelta: config_1.mailingConfig.rateLimits.delayBetweenEmails,
        rateLimit: 1, // 1 message per rateDelta
    };
    // Add DKIM if key is available
    if (dkimKey) {
        transportOptions.dkim = {
            domainName: config_1.mailingConfig.dkim.domainName,
            keySelector: config_1.mailingConfig.dkim.selector,
            privateKey: dkimKey,
        };
    }
    return nodemailer_1.default.createTransport(transportOptions);
}
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
}
// Generate unsubscribe link with token
function generateUnsubscribeLink(email, campaignId) {
    const token = Buffer.from(`${email}:${campaignId}:${Date.now()}`).toString('base64url');
    return `${config_1.mailingConfig.compliance.unsubscribeUrlBase}?token=${token}`;
}
// Add required email headers for compliance
function getComplianceHeaders(email, campaignId) {
    const unsubscribeUrl = generateUnsubscribeLink(email, campaignId);
    return {
        // List-Unsubscribe header (required for bulk email)
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@netnext.site?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        // Precedence header
        'Precedence': 'bulk',
        // X-Mailer identification
        'X-Mailer': 'NetNext Mailing System',
    };
}
// Append compliance footer to HTML
function appendComplianceFooter(html, email, campaignId) {
    const unsubscribeUrl = generateUnsubscribeLink(email, campaignId);
    const footer = `
    <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 0 0 10px 0;">
        Вы получили это письмо, потому что ваш email был добавлен в нашу рассылку.
      </p>
      <p style="margin: 0 0 10px 0;">
        <a href="${unsubscribeUrl}" style="color: #0066cc;">Отписаться от рассылки</a>
      </p>
      <p style="margin: 0; color: #999;">
        ${config_1.mailingConfig.compliance.companyAddress}
      </p>
    </div>
  `;
    // Insert before closing body tag or append
    if (html.includes('</body>')) {
        return html.replace('</body>', `${footer}</body>`);
    }
    return html + footer;
}
async function sendEmail(options) {
    const { to, subject, html, text, campaignId, recipientId, recipientName } = options;
    try {
        // Check if email is unsubscribed
        const isUnsubscribed = await (0, database_1.isEmailUnsubscribed)(to);
        if (isUnsubscribed) {
            console.log(`[Email] Skipping unsubscribed email: ${to}`);
            return {
                success: false,
                skipped: true,
                skipReason: 'unsubscribed',
            };
        }
        // Prepare email with compliance headers and footer
        const compliantHtml = appendComplianceFooter(html, to, campaignId);
        const headers = getComplianceHeaders(to, campaignId);
        // Send email
        const transport = getTransporter();
        const result = await transport.sendMail({
            from: {
                name: config_1.mailingConfig.sender.name,
                address: config_1.mailingConfig.sender.email,
            },
            to: recipientName ? { name: recipientName, address: to } : to,
            subject,
            html: compliantHtml,
            text: text || stripHtml(html),
            headers,
        });
        // Log successful send
        await (0, database_1.logMailingSend)(campaignId, recipientId, 'sent', result.messageId);
        console.log(`[Email] Sent to ${to}, messageId: ${result.messageId}`);
        return {
            success: true,
            messageId: result.messageId,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Log failed send
        await (0, database_1.logMailingSend)(campaignId, recipientId, 'failed', undefined, errorMessage);
        console.error(`[Email] Failed to send to ${to}:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}
// Simple HTML to text converter
function stripHtml(html) {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
// Verify transporter connection
async function verifyConnection() {
    try {
        const transport = getTransporter();
        await transport.verify();
        console.log('[Email] SMTP connection verified');
        return true;
    }
    catch (error) {
        console.error('[Email] SMTP connection failed:', error);
        return false;
    }
}
// Close transporter (cleanup)
function closeTransporter() {
    if (transporter) {
        transporter.close();
        transporter = null;
    }
}
