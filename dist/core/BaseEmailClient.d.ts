import { EmailData, TemplatedEmailData, SendResult, BulkSendResult, BulkSendOptions, EmailProvider, EmailRecipient, EmailRecipients, AttachmentInput, ProcessedAttachment } from '../types';
import { TrackingManager } from '../tracking/TrackingManager';
import { TrackingConfig } from '../types/tracking.types';
export declare abstract class BaseEmailClient {
    readonly provider: EmailProvider;
    protected trackingManager?: TrackingManager;
    constructor(provider: EmailProvider);
    /** Enable open/click tracking for emails sent through this client */
    enableTracking(config: TrackingConfig): void;
    /** Send a single email */
    abstract send(emailData: EmailData): Promise<SendResult>;
    /** Send a templated email */
    abstract sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    /** Send emails in bulk with concurrency control */
    sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>;
    /** Retry a send operation with exponential backoff */
    protected sendWithRetry(emailData: EmailData, maxRetries: number): Promise<SendResult>;
    /** Apply tracking (open pixel + click rewriting) to HTML content */
    protected applyTracking(html: string, emailData: EmailData): string;
    /** Process attachments from user input to provider-ready format */
    protected processAttachments(attachments?: AttachmentInput[]): Promise<ProcessedAttachment[]>;
    /** Normalize email recipient to string */
    protected toEmailString(recipient: EmailRecipient): string;
    /** Normalize recipients to string array */
    protected toEmailStrings(recipients: EmailRecipients): string[];
    /** Normalize recipient to raw email address only */
    protected toRawEmail(recipient: EmailRecipient): string;
    /** Normalize recipients to raw email array */
    protected toRawEmails(recipients: EmailRecipients): string[];
    protected delay(ms: number): Promise<void>;
}
//# sourceMappingURL=BaseEmailClient.d.ts.map