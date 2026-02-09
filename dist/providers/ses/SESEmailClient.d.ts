import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult } from '../../types';
import { SESConfig } from '../../types/provider.types';
export declare class SESEmailClient extends BaseEmailClient {
    private client;
    constructor(config: SESConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    /** Send raw MIME email (needed for attachments) */
    private sendRaw;
    /** Build a multipart MIME message with attachments */
    private buildMimeMessage;
}
//# sourceMappingURL=SESEmailClient.d.ts.map