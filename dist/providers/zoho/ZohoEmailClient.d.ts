import { BaseEmailClient } from '../../core/BaseEmailClient';
import type { EmailData, SendResult, TemplatedEmailData } from '../../types';
import type { ZohoConfig } from '../../types/provider.types';
export declare class ZohoEmailClient extends BaseEmailClient {
    private transporter;
    constructor(config: ZohoConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(_emailData: TemplatedEmailData): Promise<SendResult>;
    verify(): Promise<boolean>;
    close(): void;
}
//# sourceMappingURL=ZohoEmailClient.d.ts.map