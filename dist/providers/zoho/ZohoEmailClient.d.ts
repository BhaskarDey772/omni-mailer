import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult } from '../../types';
import { ZohoConfig } from '../../types/provider.types';
/**
 * Zoho Mail client using SMTP via nodemailer.
 * Zoho doesn't have a transactional API like other providers,
 * so we use their SMTP service.
 */
export declare class ZohoEmailClient extends BaseEmailClient {
    private transporter;
    constructor(config: ZohoConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    /** Verify SMTP connection is working */
    verify(): Promise<boolean>;
    /** Close the SMTP connection pool */
    close(): void;
}
//# sourceMappingURL=ZohoEmailClient.d.ts.map