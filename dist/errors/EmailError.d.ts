import { EmailProvider } from '../types';
export declare class EmailError extends Error {
    readonly provider: EmailProvider;
    readonly code: string;
    constructor(message: string, provider: EmailProvider, code?: string);
}
export declare class ValidationError extends Error {
    readonly field?: string;
    constructor(message: string, field?: string);
}
export declare class ProviderError extends EmailError {
    readonly httpStatus?: number;
    readonly providerCode?: string;
    constructor(message: string, provider: EmailProvider, httpStatus?: number, providerCode?: string);
}
export declare class WebhookError extends Error {
    readonly provider: EmailProvider | 'custom';
    constructor(message: string, provider: EmailProvider | 'custom');
}
//# sourceMappingURL=EmailError.d.ts.map