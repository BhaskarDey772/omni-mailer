import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult } from '../../types';
import { MailchimpConfig } from '../../types/provider.types';
export declare class MailchimpEmailClient extends BaseEmailClient {
    private api;
    private apiKey;
    constructor(config: MailchimpConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
}
//# sourceMappingURL=MailchimpEmailClient.d.ts.map