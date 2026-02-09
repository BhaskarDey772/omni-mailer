export { SESEmailClient } from './providers/ses/SESEmailClient';
export { MailgunEmailClient } from './providers/mailgun/MailgunEmailClient';
export { SendGridEmailClient } from './providers/sendgrid/SendGridEmailClient';
export { MailchimpEmailClient } from './providers/mailchimp/MailchimpEmailClient';
export { ZohoEmailClient } from './providers/zoho/ZohoEmailClient';
export { BaseEmailClient } from './core/BaseEmailClient';
export { WebhookServer } from './webhooks/WebhookServer';
export { TrackingManager } from './tracking/TrackingManager';
export { AttachmentHandler } from './attachments/AttachmentHandler';
export { ConfigValidator } from './utils/ConfigValidator';
export { EmailError, ValidationError, ProviderError, WebhookError } from './errors';
export type { EmailProvider, EmailAddress, EmailRecipient, EmailRecipients, EmailData, TemplatedEmailData, SendResult, BulkSendOptions, BulkProgress, BulkSendResult, AttachmentInput, FileAttachmentInput, BufferAttachmentInput, UrlAttachmentInput, ProcessedAttachment, BaseProviderConfig, SESConfig, MailgunConfig, SendGridConfig, MailchimpConfig, ZohoConfig, ProviderConfig, TrackingEventType, TrackingEvent, DeliveryEvent, BounceEvent, OpenEvent, ClickEvent, TrackingEventData, TrackingCallbacks, TrackingConfig, IncomingEmail, IncomingAttachment, WebhookCallbacks, WebhookServerOptions, } from './types';
//# sourceMappingURL=index.d.ts.map