import { EmailData, TemplatedEmailData, SendResult, BulkSendResult, BulkSendOptions, EmailProvider, EmailRecipient, EmailRecipients, AttachmentInput, ProcessedAttachment } from '../types';
import { TrackingManager } from '../tracking/TrackingManager';
import { TrackingConfig } from '../types/tracking.types';
export declare abstract class BaseEmailClient {
    readonly provider: EmailProvider;
    protected trackingManager?: TrackingManager;
    constructor(provider: EmailProvider);
    enableTracking(config: TrackingConfig): void;
    abstract send(emailData: EmailData): Promise<SendResult>;
    abstract sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>;
    protected sendWithRetry(emailData: EmailData, maxRetries: number): Promise<SendResult>;
    protected applyTracking(html: string, emailData: EmailData): string;
    protected processAttachments(attachments?: AttachmentInput[]): Promise<ProcessedAttachment[]>;
    protected toEmailString(recipient: EmailRecipient): string;
    protected toEmailStrings(recipients: EmailRecipients): string[];
    protected toRawEmail(recipient: EmailRecipient): string;
    protected toRawEmails(recipients: EmailRecipients): string[];
    protected delay(ms: number): Promise<void>;
}
//# sourceMappingURL=BaseEmailClient.d.ts.map