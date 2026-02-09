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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoEmailClient = void 0;
const nodemailer = __importStar(require("nodemailer"));
const BaseEmailClient_1 = require("../../core/BaseEmailClient");
const errors_1 = require("../../errors");
class ZohoEmailClient extends BaseEmailClient_1.BaseEmailClient {
    constructor(config) {
        super('zoho');
        if (!config.user)
            throw new errors_1.ValidationError('Zoho user is required', 'user');
        if (!config.password)
            throw new errors_1.ValidationError('Zoho password is required', 'password');
        this.transporter = nodemailer.createTransport({
            host: config.host || 'smtp.zoho.com',
            port: config.port || 465,
            secure: config.secure !== false,
            auth: {
                user: config.user,
                pass: config.password,
            },
            pool: true,
            maxConnections: 5,
        });
    }
    async send(emailData) {
        try {
            const attachments = await this.processAttachments(emailData.attachments);
            const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;
            const mailOptions = {
                from: this.toEmailString(emailData.from),
                to: this.toEmailStrings(emailData.to).join(', '),
                subject: emailData.subject,
                ...(html && { html }),
                ...(emailData.text && { text: emailData.text }),
                ...(emailData.replyTo && { replyTo: this.toEmailString(emailData.replyTo) }),
                ...(emailData.cc && { cc: this.toEmailStrings(emailData.cc).join(', ') }),
                ...(emailData.bcc && { bcc: this.toEmailStrings(emailData.bcc).join(', ') }),
                ...(emailData.headers && { headers: emailData.headers }),
            };
            if (attachments.length > 0) {
                mailOptions.attachments = attachments.map((att) => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                    cid: att.contentId,
                    contentDisposition: att.inline ? 'inline' : 'attachment',
                }));
            }
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                provider: 'zoho',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'zoho',
            };
        }
    }
    async sendTemplated(emailData) {
        return {
            success: false,
            error: 'Zoho does not support server-side templates. Render the template to HTML and use send() instead.',
            provider: 'zoho',
        };
    }
    async verify() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch {
            return false;
        }
    }
    close() {
        this.transporter.close();
    }
}
exports.ZohoEmailClient = ZohoEmailClient;
//# sourceMappingURL=ZohoEmailClient.js.map