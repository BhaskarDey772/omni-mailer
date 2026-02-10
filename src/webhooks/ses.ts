import axios from 'axios';
import type { Request, Response } from 'express';
import type { BounceEvent, ClickEvent, DeliveryEvent, OpenEvent } from '../types/tracking.types';
import type {
  EventHandlerOptions,
  IncomingEmail,
  IncomingHandlerOptions,
  WebhookHandler,
} from '../types/webhook.types';

export function createSESIncomingHandler(options: IncomingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.body.Type === 'SubscriptionConfirmation') {
        if (req.body.SubscribeURL) {
          await axios.get(req.body.SubscribeURL);
        }
        res.status(200).send('OK');
        return;
      }

      if (req.body.Type === 'Notification') {
        const message = JSON.parse(req.body.Message);
        const mail = message.mail;

        const email: IncomingEmail = {
          provider: 'aws-ses',
          from: mail.commonHeaders?.from?.[0] || mail.source,
          to: mail.commonHeaders?.to || mail.destination,
          subject: mail.commonHeaders?.subject || '',
          messageId: mail.messageId,
          timestamp: new Date(mail.timestamp),
          headers: mail.headers?.reduce(
            (acc: Record<string, string>, h: { name: string; value: string }) => {
              acc[h.name] = h.value;
              return acc;
            },
            {},
          ),
        };

        await options.onEmail(email);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function createSESEventHandler(options: EventHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.body.Type === 'SubscriptionConfirmation') {
        if (req.body.SubscribeURL) {
          await axios.get(req.body.SubscribeURL);
        }
        res.status(200).send('OK');
        return;
      }

      if (req.body.Type === 'Notification') {
        const message = JSON.parse(req.body.Message);
        const eventType = message.eventType || message.notificationType;

        const baseEvent = {
          provider: 'aws-ses' as const,
          messageId: message.mail?.messageId || '',
          timestamp: new Date(message.mail?.timestamp || Date.now()),
          recipient: '',
        };

        switch (eventType) {
          case 'Delivery': {
            const recipients = message.delivery?.recipients || [];
            for (const recipient of recipients) {
              await options.onEvent({
                ...baseEvent,
                type: 'delivered',
                recipient,
                smtpResponse: message.delivery?.smtpResponse,
              } as DeliveryEvent);
            }
            break;
          }
          case 'Bounce': {
            const bouncedRecipients = message.bounce?.bouncedRecipients || [];
            for (const r of bouncedRecipients) {
              await options.onEvent({
                ...baseEvent,
                type: 'bounced',
                recipient: r.emailAddress,
                bounceType: message.bounce?.bounceType === 'Permanent' ? 'hard' : 'soft',
                bounceReason: r.diagnosticCode,
                diagnosticCode: r.diagnosticCode,
              } as BounceEvent);
            }
            break;
          }
          case 'Complaint': {
            const complainedRecipients = message.complaint?.complainedRecipients || [];
            for (const r of complainedRecipients) {
              await options.onEvent({
                ...baseEvent,
                type: 'complained',
                recipient: r.emailAddress,
              });
            }
            break;
          }
          case 'Open': {
            await options.onEvent({
              ...baseEvent,
              type: 'opened',
              recipient: message.open?.ipAddress || '',
              userAgent: message.open?.userAgent,
              ipAddress: message.open?.ipAddress,
            } as OpenEvent);
            break;
          }
          case 'Click': {
            await options.onEvent({
              ...baseEvent,
              type: 'clicked',
              recipient: message.click?.ipAddress || '',
              url: message.click?.link,
              userAgent: message.click?.userAgent,
              ipAddress: message.click?.ipAddress,
            } as ClickEvent);
            break;
          }
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}
