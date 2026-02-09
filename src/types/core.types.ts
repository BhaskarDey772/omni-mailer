export type EmailProvider = 'aws-ses' | 'mailgun' | 'sendgrid' | 'mailchimp' | 'zoho';

export interface EmailAddress {
  email: string;
  name?: string;
}

export type EmailRecipient = string | EmailAddress;
export type EmailRecipients = EmailRecipient | EmailRecipient[];

export interface EmailData {
  from: EmailRecipient;
  to: EmailRecipients;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: EmailRecipient;
  cc?: EmailRecipients;
  bcc?: EmailRecipients;
  attachments?: AttachmentInput[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface TemplatedEmailData {
  from: EmailRecipient;
  to: EmailRecipients;
  template: string;
  templateData: Record<string, unknown>;
  replyTo?: EmailRecipient;
  cc?: EmailRecipients;
  bcc?: EmailRecipients;
  attachments?: AttachmentInput[];
  tags?: string[];
  metadata?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  provider: EmailProvider;
  error?: string;
}

export interface BulkSendOptions {
  concurrency?: number;
  batchSize?: number;
  delayMs?: number;
  retryAttempts?: number;
  onProgress?: (progress: BulkProgress) => void;
}

export interface BulkProgress {
  total: number;
  sent: number;
  successful: number;
  failed: number;
}

export interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
  durationMs: number;
}

export interface FileAttachmentInput {
  type: 'file';
  filename: string;
  path: string;
  contentType?: string;
  contentId?: string;
  inline?: boolean;
}

export interface BufferAttachmentInput {
  type: 'buffer';
  filename: string;
  content: Buffer;
  contentType?: string;
  contentId?: string;
  inline?: boolean;
}

export interface UrlAttachmentInput {
  type: 'url';
  filename: string;
  url: string;
  contentType?: string;
  contentId?: string;
  inline?: boolean;
}

export type AttachmentInput = FileAttachmentInput | BufferAttachmentInput | UrlAttachmentInput;

export interface ProcessedAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  contentId?: string;
  inline?: boolean;
}
