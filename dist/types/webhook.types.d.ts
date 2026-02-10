import type { Request, Response } from 'express';
import type { EmailProvider } from './core.types';
import type { TrackingCallbacks, TrackingConfig, TrackingEventData } from './tracking.types';
export type WebhookHandler = (req: Request, res: Response) => void | Promise<void>;
export interface IncomingHandlerOptions {
    onEmail: (email: IncomingEmail) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
}
export interface EventHandlerOptions {
    onEvent: (event: TrackingEventData) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
}
export interface MailgunIncomingHandlerOptions extends IncomingHandlerOptions {
    secret?: string;
}
export interface MailgunEventHandlerOptions extends EventHandlerOptions {
    secret?: string;
}
export interface OpenTrackingHandlerOptions {
    onEvent: (event: TrackingEventData) => void | Promise<void>;
}
export interface ClickTrackingHandlerOptions {
    onEvent: (event: TrackingEventData) => void | Promise<void>;
}
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