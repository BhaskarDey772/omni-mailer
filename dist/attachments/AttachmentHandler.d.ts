import { AttachmentInput, ProcessedAttachment } from '../types';
export declare class AttachmentHandler {
    static process(attachment: AttachmentInput): Promise<ProcessedAttachment>;
    static processAll(attachments: AttachmentInput[]): Promise<ProcessedAttachment[]>;
}
//# sourceMappingURL=AttachmentHandler.d.ts.map