import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult, BulkSendResult, BulkSendOptions } from '../../types';
import { SendGridConfig } from '../../types/provider.types';
export declare class SendGridEmailClient extends BaseEmailClient {
    constructor(config: SendGridConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>;
}
//# sourceMappingURL=SendGridEmailClient.d.ts.map