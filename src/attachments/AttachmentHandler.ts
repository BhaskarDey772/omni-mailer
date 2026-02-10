import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import axios from 'axios';
import { ValidationError } from '../errors';
import type { AttachmentInput, ProcessedAttachment } from '../types';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
};

function detectContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export class AttachmentHandler {
  static async process(attachment: AttachmentInput): Promise<ProcessedAttachment> {
    const contentType = attachment.contentType || detectContentType(attachment.filename);

    switch (attachment.type) {
      case 'file': {
        const content = await fs.readFile(attachment.path);
        return {
          filename: attachment.filename,
          content,
          contentType,
          contentId: attachment.contentId,
          inline: attachment.inline,
        };
      }

      case 'buffer': {
        return {
          filename: attachment.filename,
          content: attachment.content,
          contentType,
          contentId: attachment.contentId,
          inline: attachment.inline,
        };
      }

      case 'url': {
        const response = await axios.get(attachment.url, {
          responseType: 'arraybuffer',
          timeout: 30_000,
        });
        return {
          filename: attachment.filename,
          content: Buffer.from(response.data),
          contentType:
            contentType || response.headers['content-type'] || 'application/octet-stream',
          contentId: attachment.contentId,
          inline: attachment.inline,
        };
      }

      default:
        throw new ValidationError(`Invalid attachment type: ${(attachment as any).type}`);
    }
  }

  static async processAll(attachments: AttachmentInput[]): Promise<ProcessedAttachment[]> {
    return Promise.all(attachments.map((a) => AttachmentHandler.process(a)));
  }
}
