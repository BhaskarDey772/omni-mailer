import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { BaseEmailClient } from '../../core/BaseEmailClient';
import {
  EmailData,
  TemplatedEmailData,
  SendResult,
  BulkSendResult,
  BulkSendOptions,
} from '../../types';
import { MailgunConfig } from '../../types/provider.types';
import { ValidationError } from '../../errors';

export class MailgunEmailClient extends BaseEmailClient {
  private mg: ReturnType<InstanceType<typeof Mailgun>['client']>;
  private domain: string;

  constructor(config: MailgunConfig) {
    super('mailgun');

    if (!config.apiKey) throw new ValidationError('Mailgun apiKey is required', 'apiKey');
    if (!config.domain) throw new ValidationError('Mailgun domain is required', 'domain');

    this.domain = config.domain;

    const mailgun = new Mailgun(FormData);
    this.mg = mailgun.client({
      username: 'api',
      key: config.apiKey,
      ...(config.host && { url: `https://${config.host}` }),
    });
  }

  async send(emailData: EmailData): Promise<SendResult> {
    try {
      const attachments = await this.processAttachments(emailData.attachments);
      const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;

      const messageData: Record<string, any> = {
        from: this.toEmailString(emailData.from),
        to: this.toEmailStrings(emailData.to),
        subject: emailData.subject,
        ...(html && { html }),
        ...(emailData.text && { text: emailData.text }),
        ...(emailData.replyTo && { 'h:Reply-To': this.toEmailString(emailData.replyTo) }),
        ...(emailData.cc && { cc: this.toEmailStrings(emailData.cc) }),
        ...(emailData.bcc && { bcc: this.toEmailStrings(emailData.bcc) }),
        ...(emailData.tags && { 'o:tag': emailData.tags }),
        ...(emailData.trackOpens !== undefined && { 'o:tracking-opens': emailData.trackOpens ? 'yes' : 'no' }),
        ...(emailData.trackClicks !== undefined && { 'o:tracking-clicks': emailData.trackClicks ? 'yes' : 'no' }),
      };

      if (emailData.headers) {
        for (const [key, value] of Object.entries(emailData.headers)) {
          messageData[`h:${key}`] = value;
        }
      }

      if (emailData.metadata) {
        for (const [key, value] of Object.entries(emailData.metadata)) {
          messageData[`v:${key}`] = value;
        }
      }

      if (attachments.length > 0) {
        messageData.attachment = attachments.map((att) => ({
          filename: att.filename,
          data: att.content,
          contentType: att.contentType,
        }));

        const inlineAtts = attachments.filter((a) => a.inline);
        if (inlineAtts.length > 0) {
          messageData.inline = inlineAtts.map((att) => ({
            filename: att.filename,
            data: att.content,
            contentType: att.contentType,
          }));
        }
      }

      const response = await this.mg.messages.create(this.domain, messageData as any);

      return {
        success: true,
        messageId: response.id,
        provider: 'mailgun',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'mailgun',
      };
    }
  }

  async sendTemplated(emailData: TemplatedEmailData): Promise<SendResult> {
    try {
      const messageData: Record<string, any> = {
        from: this.toEmailString(emailData.from),
        to: this.toEmailStrings(emailData.to),
        template: emailData.template,
        'h:X-Mailgun-Variables': JSON.stringify(emailData.templateData),
        ...(emailData.replyTo && { 'h:Reply-To': this.toEmailString(emailData.replyTo) }),
        ...(emailData.cc && { cc: this.toEmailStrings(emailData.cc) }),
        ...(emailData.bcc && { bcc: this.toEmailStrings(emailData.bcc) }),
        ...(emailData.tags && { 'o:tag': emailData.tags }),
      };

      const response = await this.mg.messages.create(this.domain, messageData as any);

      return {
        success: true,
        messageId: response.id,
        provider: 'mailgun',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'mailgun',
      };
    }
  }

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
