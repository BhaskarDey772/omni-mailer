import { BaseEmailClient } from '../../core/BaseEmailClient';
import { EmailData, TemplatedEmailData, SendResult } from '../../types';
import { ZohoConfig } from '../../types/provider.types';
export declare class ZohoEmailClient extends BaseEmailClient {
    private transporter;
    constructor(config: ZohoConfig);
    send(emailData: EmailData): Promise<SendResult>;
    sendTemplated(emailData: TemplatedEmailData): Promise<SendResult>;
    verify(): Promise<boolean>;
    close(): void;
}
//# sourceMappingURL=ZohoEmailClient.d.ts.map