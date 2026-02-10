"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentHandler = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../errors");
const MIME_TYPES = {
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
function detectContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}
class AttachmentHandler {
    static async process(attachment) {
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
                const response = await axios_1.default.get(attachment.url, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                });
                return {
                    filename: attachment.filename,
                    content: Buffer.from(response.data),
                    contentType: contentType || response.headers['content-type'] || 'application/octet-stream',
                    contentId: attachment.contentId,
                    inline: attachment.inline,
                };
            }
            default:
                throw new errors_1.ValidationError(`Invalid attachment type: ${attachment.type}`);
        }
    }
    static async processAll(attachments) {
        return Promise.all(attachments.map((a) => AttachmentHandler.process(a)));
    }
}
exports.AttachmentHandler = AttachmentHandler;
//# sourceMappingURL=AttachmentHandler.js.map