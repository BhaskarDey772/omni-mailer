import axios, { AxiosInstance } from 'axios';
import { BaseEmailClient } from '../../core/BaseEmailClient';
import {
  EmailData,
  TemplatedEmailData,
  SendResult,
  BulkSendResult,
  BulkSendOptions,
} from '../../types';
import { MailchimpConfig } from '../../types/provider.types';
import { ValidationError } from '../../errors';

/**
 * Mailchimp Transactional (Mandrill) email client.
 * Uses the Mandrill API for transactional emails.
 */
export class MailchimpEmailClient extends BaseEmailClient {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(config: MailchimpConfig) {
    super('mailchimp');

    if (!config.apiKey) throw new ValidationError('Mailchimp apiKey is required', 'apiKey');

    this.apiKey = config.apiKey;
    this.api = axios.create({
      baseURL: 'https://mandrillapp.com/api/1.0',
      timeout: config.timeout || 30_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async send(emailData: EmailData): Promise<SendResult> {
    try {
      const attachments = await this.processAttachments(emailData.attachments);
      const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;

      const toAddresses = this.toRawEmails(emailData.to);
      const recipients: Array<{ email: string; type: string }> = toAddresses.map((email) => ({
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

      const message: Record<string, any> = {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'mailchimp',
      };
    }
  }

  async sendTemplated(emailData: TemplatedEmailData): Promise<SendResult> {
    try {
      const toAddresses = this.toRawEmails(emailData.to);
      const recipients: Array<{ email: string; type: string }> = toAddresses.map((email) => ({
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

      const message: Record<string, any> = {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'mailchimp',
      };
    }
  }
}
