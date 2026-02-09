import {
  EmailData,
  TemplatedEmailData,
  SendResult,
  BulkSendResult,
  BulkSendOptions,
  EmailProvider,
  EmailRecipient,
  EmailRecipients,
  AttachmentInput,
  ProcessedAttachment,
} from '../types';
import { AttachmentHandler } from '../attachments/AttachmentHandler';
import { TrackingManager } from '../tracking/TrackingManager';
import { TrackingConfig } from '../types/tracking.types';

export abstract class BaseEmailClient {
  public readonly provider: EmailProvider;
  protected trackingManager?: TrackingManager;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  /** Enable open/click tracking for emails sent through this client */
  enableTracking(config: TrackingConfig): void {
    this.trackingManager = new TrackingManager(config);
  }

  /** Send a single email */
  abstract send(emailData: EmailData): Promise<SendResult>;

  /** Send a templated email */
  abstract sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;

  /** Send emails in bulk with concurrency control */
  async sendBulk(emails: EmailData[], options: BulkSendOptions = {}): Promise<BulkSendResult> {
    const { concurrency = 5, delayMs = 100, retryAttempts = 0, onProgress } = options;
    const results: SendResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((email) => this.sendWithRetry(email, retryAttempts))
      );
      results.push(...batchResults);

      if (onProgress) {
        onProgress({
          total: emails.length,
          sent: Math.min(i + concurrency, emails.length),
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        });
      }

      if (i + concurrency < emails.length && delayMs > 0) {
        await this.delay(delayMs);
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

  /** Retry a send operation with exponential backoff */
  protected async sendWithRetry(emailData: EmailData, maxRetries: number): Promise<SendResult> {
    let lastResult: SendResult | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.send(emailData);
      if (lastResult.success) return lastResult;

      if (attempt < maxRetries) {
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return lastResult!;
  }

  /** Apply tracking (open pixel + click rewriting) to HTML content */
  protected applyTracking(html: string, emailData: EmailData): string {
    if (!this.trackingManager || !html) return html;

    let tracked = html;
    if (emailData.trackOpens !== false) {
      tracked = this.trackingManager.injectOpenPixel(tracked, emailData.metadata?.messageId || '');
    }
    if (emailData.trackClicks !== false) {
      tracked = this.trackingManager.rewriteLinks(tracked, emailData.metadata?.messageId || '');
    }
    return tracked;
  }

  /** Process attachments from user input to provider-ready format */
  protected async processAttachments(
    attachments?: AttachmentInput[]
  ): Promise<ProcessedAttachment[]> {
    if (!attachments || attachments.length === 0) return [];
    return AttachmentHandler.processAll(attachments);
  }

  /** Normalize email recipient to string */
  protected toEmailString(recipient: EmailRecipient): string {
    if (typeof recipient === 'string') return recipient;
    return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
  }

  /** Normalize recipients to string array */
  protected toEmailStrings(recipients: EmailRecipients): string[] {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => this.toEmailString(r));
    }
    return [this.toEmailString(recipients)];
  }

  /** Normalize recipient to raw email address only */
  protected toRawEmail(recipient: EmailRecipient): string {
    if (typeof recipient === 'string') return recipient;
    return recipient.email;
  }

  /** Normalize recipients to raw email array */
  protected toRawEmails(recipients: EmailRecipients): string[] {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => this.toRawEmail(r));
    }
    return [this.toRawEmail(recipients)];
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
