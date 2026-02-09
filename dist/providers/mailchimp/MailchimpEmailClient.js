"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailchimpEmailClient = void 0;
const axios_1 = __importDefault(require("axios"));
const BaseEmailClient_1 = require("../../core/BaseEmailClient");
const errors_1 = require("../../errors");
/**
 * Mailchimp Transactional (Mandrill) email client.
 * Uses the Mandrill API for transactional emails.
 */
class MailchimpEmailClient extends BaseEmailClient_1.BaseEmailClient {
    constructor(config) {
        super('mailchimp');
        if (!config.apiKey)
            throw new errors_1.ValidationError('Mailchimp apiKey is required', 'apiKey');
        this.apiKey = config.apiKey;
        this.api = axios_1.default.create({
            baseURL: 'https://mandrillapp.com/api/1.0',
            timeout: config.timeout || 30000,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async send(emailData) {
        try {
            const attachments = await this.processAttachments(emailData.attachments);
            const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;
            const toAddresses = this.toRawEmails(emailData.to);
            const recipients = toAddresses.map((email) => ({
                email,
                type: 'to',
            }));
            // Add CC
            if (emailData.cc) {
                const ccAddresses = this.toRawEmails(emailData.cc);
                recipients.push(...ccAddresses.map((email) => ({ email, type: 'cc' })));
            }
            // Add BCC
            if (emailData.bcc) {
                const bccAddresses = this.toRawEmails(emailData.bcc);
                recipients.push(...bccAddresses.map((email) => ({ email, type: 'bcc' })));
            }
            const message = {
                from_email: this.toRawEmail(emailData.from),
                from_name: typeof emailData.from === 'object' ? emailData.from.name : undefined,
                to: recipients,
                subject: emailData.subject,
                ...(html && { html }),
                ...(emailData.text && { text: emailData.text }),
                ...(emailData.tags && { tags: emailData.tags }),
                ...(emailData.metadata && { metadata: emailData.metadata }),
                track_opens: emailData.trackOpens ?? true,
                track_clicks: emailData.trackClicks ?? true,
            };
            if (emailData.replyTo) {
                message.headers = { 'Reply-To': this.toEmailString(emailData.replyTo) };
            }
            if (emailData.headers) {
                message.headers = { ...message.headers, ...emailData.headers };
            }
            // Add attachments
            if (attachments.length > 0) {
                const regularAtts = attachments.filter((a) => !a.inline);
                const inlineAtts = attachments.filter((a) => a.inline);
                if (regularAtts.length > 0) {
                    message.attachments = regularAtts.map((att) => ({
                        type: att.contentType,
                        name: att.filename,
                        content: att.content.toString('base64'),
                    }));
                }
                if (inlineAtts.length > 0) {
                    message.images = inlineAtts.map((att) => ({
                        type: att.contentType,
                        name: att.contentId || att.filename,
                        content: att.content.toString('base64'),
                    }));
                }
            }
            const response = await this.api.post('/messages/send', {
                key: this.apiKey,
                message,
            });
            const result = response.data[0];
            if (result.status === 'rejected' || result.status === 'invalid') {
                return {
                    success: false,
                    error: result.reject_reason || `Email ${result.status}`,
                    provider: 'mailchimp',
                };
            }
            return {
                success: true,
                messageId: result._id,
                provider: 'mailchimp',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                provider: 'mailchimp',
            };
        }
    }
    async sendTemplated(emailData) {
        try {
            const toAddresses = this.toRawEmails(emailData.to);
            const recipients = toAddresses.map((email) => ({
                email,
                type: 'to',
            }));
            if (emailData.cc) {
                const ccAddresses = this.toRawEmails(emailData.cc);
                recipients.push(...ccAddresses.map((email) => ({ email, type: 'cc' })));
            }
            if (emailData.bcc) {
                const bccAddresses = this.toRawEmails(emailData.bcc);
                recipients.push(...bccAddresses.map((email) => ({ email, type: 'bcc' })));
            }
            // Convert templateData to merge_vars format
            const mergeVars = toAddresses.map((email) => ({
                rcpt: email,
                vars: Object.entries(emailData.templateData).map(([name, content]) => ({
                    name,
                    content,
                })),
            }));
            const message = {
                from_email: this.toRawEmail(emailData.from),
                from_name: typeof emailData.from === 'object' ? emailData.from.name : undefined,
                to: recipients,
                merge_vars: mergeVars,
                ...(emailData.tags && { tags: emailData.tags }),
                ...(emailData.metadata && { metadata: emailData.metadata }),
            };
            if (emailData.replyTo) {
                message.headers = { 'Reply-To': this.toEmailString(emailData.replyTo) };
            }
            // Add attachments
            if (emailData.attachments) {
                const attachments = await this.processAttachments(emailData.attachments);
                message.attachments = attachments
                    .filter((a) => !a.inline)
                    .map((att) => ({
                    type: att.contentType,
                    name: att.filename,
                    content: att.content.toString('base64'),
                }));
            }
            const response = await this.api.post('/messages/send-template', {
                key: this.apiKey,
                template_name: emailData.template,
                template_content: [],
                message,
            });
            const result = response.data[0];
            if (result.status === 'rejected' || result.status === 'invalid') {
                return {
                    success: false,
                    error: result.reject_reason || `Email ${result.status}`,
                    provider: 'mailchimp',
                };
            }
            return {
                success: true,
                messageId: result._id,
                provider: 'mailchimp',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                provider: 'mailchimp',
            };
        }
    }
}
exports.MailchimpEmailClient = MailchimpEmailClient;
//# sourceMappingURL=MailchimpEmailClient.js.map