import { BaseEmailClient } from '../../core/BaseEmailClient';
import type { BulkSendOptions, BulkSendResult, EmailData, SendResult, TemplatedEmailData } from '../../types';
import type { MailgunConfig } from '../../types/provider.types';
export declare class MailgunEmailClient extends BaseEmailClient {
    private mg;
    private domain;
    constructor(config: MailgunConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>;
}
//# sourceMappingURL=MailgunEmailClient.d.ts.map