import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult, BulkSendResult, BulkSendOptions } from '../../types';
import { MailgunConfig } from '../../types/provider.types';
export declare class MailgunEmailClient extends BaseEmailClient {
    private mg;
    private domain;
    constructor(config: MailgunConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>;
}
//# sourceMappingURL=MailgunEmailClient.d.ts.map