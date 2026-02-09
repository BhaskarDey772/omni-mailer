import sgMail from '@sendgrid/mail';
import { BaseEmailClient } from '../../core/BaseEmailClient';
import {
  EmailData,
  TemplatedEmailData,
  SendResult,
  BulkSendResult,
  BulkSendOptions,
} from '../../types';
import { SendGridConfig } from '../../types/provider.types';
import { ValidationError } from '../../errors';

export class SendGridEmailClient extends BaseEmailClient {
  constructor(config: SendGridConfig) {
    super('sendgrid');

    if (!config.apiKey) throw new ValidationError('SendGrid apiKey is required', 'apiKey');

    sgMail.setApiKey(config.apiKey);
  }

  async send(emailData: EmailData): Promise<SendResult> {
    try {
      const attachments = await this.processAttachments(emailData.attachments);
      const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;

      const msg: Record<string, any> = {
        from: this.toEmailString(emailData.from),
        to: this.toEmailStrings(emailData.to),
        subject: emailData.subject,
        ...(html && { html }),
        ...(emailData.text && { text: emailData.text }),
        ...(emailData.replyTo && { replyTo: this.toEmailString(emailData.replyTo) }),
        ...(emailData.cc && { cc: this.toEmailStrings(emailData.cc) }),
        ...(emailData.bcc && { bcc: this.toEmailStrings(emailData.bcc) }),
        ...(emailData.headers && { headers: emailData.headers }),
        trackingSettings: {
          openTracking: { enable: emailData.trackOpens ?? false },
          clickTracking: { enable: emailData.trackClicks ?? false },
        },
      };

      // Add categories (tags)
      if (emailData.tags) {
        msg.categories = emailData.tags;
      }

      // Add custom args (metadata)
      if (emailData.metadata) {
        msg.customArgs = emailData.metadata;
      }

      // Add attachments
      if (attachments.length > 0) {
        msg.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.contentType,
          disposition: att.inline ? 'inline' : 'attachment',
          ...(att.contentId && { contentId: att.contentId }),
        }));
      }

      const [response] = await sgMail.send(msg as any);
      const messageId = response.headers?.['x-message-id'] as string | undefined;

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.body?.errors?.[0]?.message || error.message;
      return {
        success: false,
        error: errorMessage,
        provider: 'sendgrid',
      };
    }
  }

  async sendTemplated(emailData: TemplatedEmailData): Promise<SendResult> {
    try {
      const msg: Record<string, any> = {
        from: this.toEmailString(emailData.from),
        to: this.toEmailStrings(emailData.to),
        templateId: emailData.template,
        dynamicTemplateData: emailData.templateData,
        ...(emailData.replyTo && { replyTo: this.toEmailString(emailData.replyTo) }),
        ...(emailData.cc && { cc: this.toEmailStrings(emailData.cc) }),
        ...(emailData.bcc && { bcc: this.toEmailStrings(emailData.bcc) }),
        ...(emailData.tags && { categories: emailData.tags }),
      };

      // Add attachments
      if (emailData.attachments) {
        const attachments = await this.processAttachments(emailData.attachments);
        msg.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.contentType,
          disposition: att.inline ? 'inline' : 'attachment',
          ...(att.contentId && { contentId: att.contentId }),
        }));
      }

      const [response] = await sgMail.send(msg as any);
      const messageId = response.headers?.['x-message-id'] as string | undefined;

      return {
        success: true,
        messageId,
        provider: 'sendgrid',
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.body?.errors?.[0]?.message || error.message;
      return {
        success: false,
        error: errorMessage,
        provider: 'sendgrid',
      };
    }
  }

  /** Override bulk to use SendGrid's sendMultiple for efficiency */
  async sendBulk(emails: EmailData[], options: BulkSendOptions = {}): Promise<BulkSendResult> {
    const { batchSize = 1000, onProgress } = options;
    const results: SendResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((email) => this.send(email)));
      results.push(...batchResults);

      if (onProgress) {
        onProgress({
          total: emails.length,
          sent: Math.min(i + batchSize, emails.length),
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        });
      }
    }

    return {
      total: emails.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
      durationMs: Date.now() - startTime,
    };
  }
}
