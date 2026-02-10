import type { EmailProvider } from '../types';

export class EmailError extends Error {
  public readonly provider: EmailProvider;
  public readonly code: string;

  constructor(message: string, provider: EmailProvider, code: string = 'EMAIL_ERROR') {
    super(message);
    this.name = 'EmailError';
    this.provider = provider;
    this.code = code;
  }
}

export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class ProviderError extends EmailError {
  public readonly httpStatus?: number;
  public readonly providerCode?: string;

  constructor(
    message: string,
    provider: EmailProvider,
    httpStatus?: number,
    providerCode?: string,
  ) {
    super(message, provider, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
    this.httpStatus = httpStatus;
    this.providerCode = providerCode;
  }
}

export class WebhookError extends Error {
  public readonly provider: EmailProvider | 'custom';

  constructor(message: string, provider: EmailProvider | 'custom') {
    super(message);
    this.name = 'WebhookError';
    this.provider = provider;
  }
}
