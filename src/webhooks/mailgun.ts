import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { IncomingEmail, MailgunIncomingHandlerOptions, MailgunEventHandlerOptions, WebhookHandler } from '../types/webhook.types';
import { DeliveryEvent, BounceEvent, OpenEvent, ClickEvent } from '../types/tracking.types';

export function createMailgunIncomingHandler(options: MailgunIncomingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      if (options.secret) {
        const { timestamp, token, signature } = req.body;
        const hmac = crypto
          .createHmac('sha256', options.secret)
          .update(timestamp + token)
          .digest('hex');
        if (hmac !== signature) {
          res.status(403).json({ error: 'Invalid signature' });
          return;
        }
      }

      const email: IncomingEmail = {
        provider: 'mailgun',
        from: req.body.sender || req.body.from,
        to: Array.isArray(req.body.recipient)
          ? req.body.recipient
          : [req.body.recipient],
        subject: req.body.subject || '',
        text: req.body['body-plain'],
        html: req.body['body-html'],
        messageId: req.body['Message-Id'] || '',
        inReplyTo: req.body['In-Reply-To'],
        references: req.body.References?.split(' ').filter(Boolean),
        timestamp: new Date(parseInt(req.body.timestamp) * 1000),
      };

      await options.onEmail(email);
      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function createMailgunEventHandler(options: MailgunEventHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      if (options.secret) {
        const sig = req.body.signature;
        if (sig) {
          const hmac = crypto
            .createHmac('sha256', options.secret)
            .update(sig.timestamp + sig.token)
            .digest('hex');
          if (hmac !== sig.signature) {
            res.status(403).json({ error: 'Invalid signature' });
            return;
          }
        }
      }

      const eventData = req.body['event-data'] || req.body;
      const event = eventData.event;

      const baseEvent = {
        provider: 'mailgun' as const,
        messageId: eventData.message?.headers?.['message-id'] || '',
        timestamp: new Date((eventData.timestamp || 0) * 1000),
        recipient: eventData.recipient || '',
      };

      switch (event) {
        case 'delivered':
          await options.onEvent({ ...baseEvent, type: 'delivered' } as DeliveryEvent);
          break;
        case 'failed':
          await options.onEvent({
            ...baseEvent,
            type: 'bounced',
            bounceType: eventData.severity === 'permanent' ? 'hard' : 'soft',
            bounceReason: eventData.reason,
          } as BounceEvent);
          break;
        case 'opened':
          await options.onEvent({
            ...baseEvent,
            type: 'opened',
            userAgent: eventData['user-agent'],
            ipAddress: eventData.ip,
          } as OpenEvent);
          break;
        case 'clicked':
          await options.onEvent({
            ...baseEvent,
            type: 'clicked',
            url: eventData.url,
            userAgent: eventData['user-agent'],
            ipAddress: eventData.ip,
          } as ClickEvent);
          break;
        case 'complained':
          await options.onEvent({ ...baseEvent, type: 'complained' });
          break;
        case 'unsubscribed':
          await options.onEvent({ ...baseEvent, type: 'unsubscribed' });
          break;
      }

      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}
