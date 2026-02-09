// ── Provider Clients ────────────────────────────────────
export { SESEmailClient } from './providers/ses/SESEmailClient';
export { MailgunEmailClient } from './providers/mailgun/MailgunEmailClient';
export { SendGridEmailClient } from './providers/sendgrid/SendGridEmailClient';
export { MailchimpEmailClient } from './providers/mailchimp/MailchimpEmailClient';
export { ZohoEmailClient } from './providers/zoho/ZohoEmailClient';

// ── Base Client (for extending with custom providers) ───
export { BaseEmailClient } from './core/BaseEmailClient';

// ── Webhook Server ──────────────────────────────────────
export { WebhookServer } from './webhooks/WebhookServer';

// ── Tracking ────────────────────────────────────────────
export { TrackingManager } from './tracking/TrackingManager';

// ── Attachments ─────────────────────────────────────────
export { AttachmentHandler } from './attachments/AttachmentHandler';

// ── Utilities ───────────────────────────────────────────
export { ConfigValidator } from './utils/ConfigValidator';

// ── Errors ──────────────────────────────────────────────
export { EmailError, ValidationError, ProviderError, WebhookError } from './errors';

// ── Types ───────────────────────────────────────────────
export type {
  // Core
  EmailProvider,
  EmailAddress,
  EmailRecipient,
  EmailRecipients,
  EmailData,
  TemplatedEmailData,
  SendResult,
  BulkSendOptions,
  BulkProgress,
  BulkSendResult,
  AttachmentInput,
  FileAttachmentInput,
  BufferAttachmentInput,
  UrlAttachmentInput,
  ProcessedAttachment,

  // Provider configs
  BaseProviderConfig,
  SESConfig,
  MailgunConfig,
  SendGridConfig,
  MailchimpConfig,
  ZohoConfig,
  ProviderConfig,

  // Tracking
  TrackingEventType,
  TrackingEvent,
  DeliveryEvent,
  BounceEvent,
  OpenEvent,
  ClickEvent,
  TrackingEventData,
  TrackingCallbacks,
  TrackingConfig,

  // Webhooks
  IncomingEmail,
  IncomingAttachment,
  WebhookCallbacks,
  WebhookServerOptions,
} from './types';
