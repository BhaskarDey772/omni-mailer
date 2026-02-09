import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult } from '../../types';
import { SESConfig } from '../../types/provider.types';
export declare class SESEmailClient extends BaseEmailClient {
    private client;
    constructor(config: SESConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    private sendRaw;
    private buildMimeMessage;
}
//# sourceMappingURL=SESEmailClient.d.ts.map