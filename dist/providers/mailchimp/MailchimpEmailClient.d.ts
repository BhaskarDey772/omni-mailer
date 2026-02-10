import { BaseEmailClient } from '../../core/BaseEmailClient';
import type { EmailData, SendResult, TemplatedEmailData } from '../../types';
import type { MailchimpConfig } from '../../types/provider.types';
export declare class MailchimpEmailClient extends BaseEmailClient {
    private api;
    private apiKey;
    constructor(config: MailchimpConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
}
//# sourceMappingURL=MailchimpEmailClient.d.ts.map