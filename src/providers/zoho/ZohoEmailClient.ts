import * as nodemailer from 'nodemailer';
import { BaseEmailClient } from '../../core/BaseEmailClient';
import {
  EmailData,
  TemplatedEmailData,
  SendResult,
} from '../../types';
import { ZohoConfig } from '../../types/provider.types';
import { ValidationError } from '../../errors';

/**
 * Zoho Mail client using SMTP via nodemailer.
 * Zoho doesn't have a transactional API like other providers,
 * so we use their SMTP service.
 */
export class ZohoEmailClient extends BaseEmailClient {
  private transporter: nodemailer.Transporter;

  constructor(config: ZohoConfig) {
    super('zoho');

    if (!config.user) throw new ValidationError('Zoho user is required', 'user');
    if (!config.password) throw new ValidationError('Zoho password is required', 'password');

    this.transporter = nodemailer.createTransport({
      host: config.host || 'smtp.zoho.com',
      port: config.port || 465,
      secure: config.secure !== false,
      auth: {
        user: config.user,
        pass: config.password,
      },
      pool: true, // Use connection pooling for bulk sends
      maxConnections: 5,
    });
  }

  async send(emailData: EmailData): Promise<SendResult> {
    try {
      const attachments = await this.processAttachments(emailData.attachments);
      const html = emailData.html ? this.applyTracking(emailData.html, emailData) : undefined;

      const mailOptions: nodemailer.SendMailOptions = {
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

      // Add attachments
      if (attachments.length > 0) {
        mailOptions.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.contentId,
          contentDisposition: att.inline ? ('inline' as const) : ('attachment' as const),
        }));
      }

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'zoho',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'zoho',
      };
    }
  }

  async sendTemplated(emailData: TemplatedEmailData): Promise<SendResult> {
    // Zoho SMTP doesn't have native template support.
    // Users should render templates themselves before sending.
    return {
      success: false,
      error:
        'Zoho does not support server-side templates. Render the template to HTML and use send() instead.',
      provider: 'zoho',
    };
  }

  /** Verify SMTP connection is working */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  /** Close the SMTP connection pool */
  close(): void {
    this.transporter.close();
  }
}
