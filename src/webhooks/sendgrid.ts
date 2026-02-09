import { Request, Response } from 'express';
import { IncomingEmail, IncomingHandlerOptions, EventHandlerOptions, WebhookHandler } from '../types/webhook.types';
import { DeliveryEvent, BounceEvent, OpenEvent, ClickEvent } from '../types/tracking.types';

export function createSendGridIncomingHandler(options: IncomingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const email: IncomingEmail = {
        provider: 'sendgrid',
        from: req.body.from || '',
        to: req.body.to ? [req.body.to] : [],
        subject: req.body.subject || '',
        text: req.body.text,
        html: req.body.html,
        messageId: '',
        timestamp: new Date(),
        envelope: req.body.envelope ? JSON.parse(req.body.envelope) : undefined,
      };

      if (req.body.headers) {
        try {
          const headers = JSON.parse(req.body.headers);
          email.messageId = headers['Message-ID'] || '';
        } catch {}
      }

      await options.onEmail(email);
      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function createSendGridEventHandler(options: EventHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const sgEvent of events) {
        const baseEvent = {
          provider: 'sendgrid' as const,
          messageId: sgEvent.sg_message_id || '',
          timestamp: new Date((sgEvent.timestamp || 0) * 1000),
          recipient: sgEvent.email || '',
        };

        switch (sgEvent.event) {
          case 'delivered':
            await options.onEvent({
              ...baseEvent,
              type: 'delivered',
              smtpResponse: sgEvent.response,
            } as DeliveryEvent);
            break;
          case 'bounce':
            await options.onEvent({
              ...baseEvent,
              type: 'bounced',
              bounceType: sgEvent.type === 'bounce' ? 'hard' : 'soft',
              bounceReason: sgEvent.reason,
            } as BounceEvent);
            break;
          case 'open':
            await options.onEvent({
              ...baseEvent,
              type: 'opened',
              userAgent: sgEvent.useragent,
              ipAddress: sgEvent.ip,
            } as OpenEvent);
            break;
          case 'click':
            await options.onEvent({
              ...baseEvent,
              type: 'clicked',
              url: sgEvent.url,
              userAgent: sgEvent.useragent,
              ipAddress: sgEvent.ip,
            } as ClickEvent);
            break;
          case 'spamreport':
            await options.onEvent({ ...baseEvent, type: 'complained' });
            break;
          case 'unsubscribe':
          case 'group_unsubscribe':
            await options.onEvent({ ...baseEvent, type: 'unsubscribed' });
            break;
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}
