import { SESConfig, MailgunConfig, SendGridConfig, MailchimpConfig, ZohoConfig, ProviderConfig } from '../types/provider.types';
import { EmailProvider } from '../types/core.types';
/**
 * Build provider config from environment variables.
 * Throws if required env vars are missing.
 */
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