"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESEmailClient = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const BaseEmailClient_1 = require("../../core/BaseEmailClient");
const errors_1 = require("../../errors");
class SESEmailClient extends BaseEmailClient_1.BaseEmailClient {
    constructor(config) {
        super('aws-ses');
        if (!config.region)
            throw new errors_1.ValidationError('SES region is required', 'region');
        if (!config.accessKeyId)
            throw new errors_1.ValidationError('SES accessKeyId is required', 'accessKeyId');
        if (!config.secretAccessKey)
            throw new errors_1.ValidationError('SES secretAccessKey is required', 'secretAccessKey');
        this.client = new client_ses_1.SESClient({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
                ...(config.sessionToken && { sessionToken: config.sessionToken }),
            },
        });
    }
    async send(emailData) {
        try {
            const hasAttachments = emailData.attachments && emailData.attachments.length > 0;
            if (hasAttachments) {
                return await this.sendRaw(emailData);
            }
            const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;
            const params = {
                Source: this.toEmailString(emailData.from),
                Destination: {
                    ToAddresses: this.toEmailStrings(emailData.to),
                    ...(emailData.cc && { CcAddresses: this.toEmailStrings(emailData.cc) }),
                    ...(emailData.bcc && { BccAddresses: this.toEmailStrings(emailData.bcc) }),
                },
                Message: {
                    Subject: { Data: emailData.subject, Charset: 'UTF-8' },
                    Body: {
                        ...(html && { Html: { Data: html, Charset: 'UTF-8' } }),
                        ...(emailData.text && { Text: { Data: emailData.text, Charset: 'UTF-8' } }),
                    },
                },
                ...(emailData.replyTo && { ReplyToAddresses: [this.toEmailString(emailData.replyTo)] }),
                ...(emailData.tags && {
                    Tags: emailData.tags.map((t) => ({ Name: 'tag', Value: t })),
                }),
            };
            const response = await this.client.send(new client_ses_1.SendEmailCommand(params));
            return {
                success: true,
                messageId: response.MessageId,
                provider: 'aws-ses',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'aws-ses',
            };
        }
    }
    async sendTemplated(emailData) {
        try {
            const params = {
                Source: this.toEmailString(emailData.from),
                Destination: {
                    ToAddresses: this.toEmailStrings(emailData.to),
                    ...(emailData.cc && { CcAddresses: this.toEmailStrings(emailData.cc) }),
                    ...(emailData.bcc && { BccAddresses: this.toEmailStrings(emailData.bcc) }),
                },
                Template: emailData.template,
                TemplateData: JSON.stringify(emailData.templateData),
                ...(emailData.replyTo && { ReplyToAddresses: [this.toEmailString(emailData.replyTo)] }),
            };
            const response = await this.client.send(new client_ses_1.SendTemplatedEmailCommand(params));
            return {
                success: true,
                messageId: response.MessageId,
                provider: 'aws-ses',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'aws-ses',
            };
        }
    }
    /** Send raw MIME email (needed for attachments) */
    async sendRaw(emailData) {
        try {
            const attachments = await this.processAttachments(emailData.attachments);
            const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;
            const rawMessage = this.buildMimeMessage(emailData, html, attachments);
            const response = await this.client.send(new client_ses_1.SendRawEmailCommand({
                RawMessage: { Data: Buffer.from(rawMessage) },
            }));
            return {
                success: true,
                messageId: response.MessageId,
                provider: 'aws-ses',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'aws-ses',
            };
        }
    }
    /** Build a multipart MIME message with attachments */
    buildMimeMessage(emailData, html, attachments) {
        const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const lines = [];
        // Headers
        lines.push(`From: ${this.toEmailString(emailData.from)}`);
        lines.push(`To: ${this.toEmailStrings(emailData.to).join(', ')}`);
        if (emailData.cc)
            lines.push(`Cc: ${this.toEmailStrings(emailData.cc).join(', ')}`);
        lines.push(`Subject: =?UTF-8?B?${Buffer.from(emailData.subject).toString('base64')}?=`);
        lines.push('MIME-Version: 1.0');
        if (emailData.replyTo) {
            lines.push(`Reply-To: ${this.toEmailString(emailData.replyTo)}`);
        }
        if (emailData.headers) {
            for (const [key, value] of Object.entries(emailData.headers)) {
                lines.push(`${key}: ${value}`);
            }
        }
        lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
        lines.push('');
        // Body part (text + html)
        lines.push(`--${mixedBoundary}`);
        lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        lines.push('');
        if (emailData.text) {
            lines.push(`--${boundary}`);
            lines.push('Content-Type: text/plain; charset=UTF-8');
            lines.push('Content-Transfer-Encoding: 7bit');
            lines.push('');
            lines.push(emailData.text);
            lines.push('');
        }
        if (html) {
            lines.push(`--${boundary}`);
            lines.push('Content-Type: text/html; charset=UTF-8');
            lines.push('Content-Transfer-Encoding: quoted-printable');
            lines.push('');
            lines.push(html);
            lines.push('');
        }
        lines.push(`--${boundary}--`);
        // Attachments
        for (const att of attachments) {
            lines.push(`--${mixedBoundary}`);
            const disposition = att.inline ? 'inline' : 'attachment';
            lines.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
            lines.push(`Content-Disposition: ${disposition}; filename="${att.filename}"`);
            lines.push('Content-Transfer-Encoding: base64');
            if (att.contentId) {
                lines.push(`Content-ID: <${att.contentId}>`);
            }
            lines.push('');
            // Base64 encode in 76-char lines
            const b64 = att.content.toString('base64');
            for (let i = 0; i < b64.length; i += 76) {
                lines.push(b64.slice(i, i + 76));
            }
            lines.push('');
        }
        lines.push(`--${mixedBoundary}--`);
        return lines.join('\r\n');
    }
}
exports.SESEmailClient = SESEmailClient;
//# sourceMappingURL=SESEmailClient.js.map