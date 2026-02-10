import type { EmailProvider } from '../types/core.types';
import type { MailchimpConfig, MailgunConfig, ProviderConfig, SESConfig, SendGridConfig, ZohoConfig } from '../types/provider.types';
export declare class ConfigValidator {
    static fromEnv(provider: EmailProvider): ProviderConfig;
    static sesFromEnv(): SESConfig;
    static mailgunFromEnv(): MailgunConfig;
    static sendgridFromEnv(): SendGridConfig;
    static mailchimpFromEnv(): MailchimpConfig;
    static zohoFromEnv(): ZohoConfig;
    private static requireEnv;
}
//# sourceMappingURL=ConfigValidator.d.ts.map