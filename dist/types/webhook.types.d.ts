import { EmailProvider } from './core.types';
import { TrackingCallbacks, TrackingConfig } from './tracking.types';
export interface IncomingEmail {
    provider: EmailProvider | 'custom';
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    messageId: string;
    inReplyTo?: string;
    references?: string[];
    timestamp: Date;
    headers?: Record<string, string>;
    attachments?: IncomingAttachment[];
    envelope?: {
        from: string;
        to: string[];
    };
    raw?: string;
}
export interface IncomingAttachment {
    filename: string;
    contentType: string;
    size: number;
    url?: string;
    content?: Buffer;
}
export interface WebhookCallbacks {
    onIncomingEmail?: (email: IncomingEmail) => void | Promise<void>;
    onError?: (error: Error, provider: EmailProvider | 'custom') => void | Promise<void>;
}
export interface WebhookServerOptions {
    port?: number;
    host?: string;
    basePath?: string;
    maxBodySize?: string;
    webhookCallbacks: WebhookCallbacks;
    trackingCallbacks?: TrackingCallbacks;
    trackingConfig?: TrackingConfig;
    verifySignatures?: boolean;
    webhookSecrets?: {
        mailgun?: string;
        sendgrid?: string;
        mailchimp?: string;
    };
}
//# sourceMappingURL=webhook.types.d.ts.map