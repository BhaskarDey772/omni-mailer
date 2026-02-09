import { EmailProvider } from './core.types';

export interface BaseProviderConfig {
  provider: EmailProvider;
  timeout?: number;
  retryAttempts?: number;
}

export interface SESConfig extends BaseProviderConfig {
  provider: 'aws-ses';
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface MailgunConfig extends BaseProviderConfig {
  provider: 'mailgun';
  apiKey: string;
  domain: string;
  host?: string; // 'api.eu.mailgun.net' for EU
}

export interface SendGridConfig extends BaseProviderConfig {
  provider: 'sendgrid';
  apiKey: string;
}

export interface MailchimpConfig extends BaseProviderConfig {
  provider: 'mailchimp';
  apiKey: string;
}

export interface ZohoConfig extends BaseProviderConfig {
  provider: 'zoho';
  user: string;
  password: string;
  host?: string;
  port?: number;
  secure?: boolean;
}

export type ProviderConfig = SESConfig | MailgunConfig | SendGridConfig | MailchimpConfig | ZohoConfig;
