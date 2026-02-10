import type { Request, Response } from 'express';
import type { BounceEvent, ClickEvent, DeliveryEvent, OpenEvent } from '../types/tracking.types';
import type {
  EventHandlerOptions,
  IncomingEmail,
  IncomingHandlerOptions,
  WebhookHandler,
} from '../types/webhook.types';

export function createMailchimpIncomingHandler(options: IncomingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const email: IncomingEmail = {
        provider: 'mailchimp',
        from: req.body.from_email || req.body.msg?.from_email || '',
        to: req.body.to ? [req.body.to] : [],
        subject: req.body.subject || req.body.msg?.subject || '',
        text: req.body.text || req.body.msg?.text,
        html: req.body.html || req.body.msg?.html,
        messageId: req.body.msg?._id || '',
        timestamp: req.body.ts ? new Date(req.body.ts * 1000) : new Date(),
      };

      await options.onEmail(email);
      res.status(200).send('OK');
    } catch (error: any) {
      await options.onError?.(error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function createMailchimpEventHandler(options: EventHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      let events = req.body;
      if (req.body.mandrill_events) {
        events = JSON.parse(req.body.mandrill_events);
      }
      if (!Array.isArray(events)) events = [events];

      for (const mcEvent of events) {
        const msg = mcEvent.msg || {};
        const baseEvent = {
          provider: 'mailchimp' as const,
          messageId: msg._id || '',
          timestamp: new Date((mcEvent.ts || 0) * 1000),
          recipient: msg.email || '',
        };

        switch (mcEvent.event) {
          case 'send':
            await options.onEvent({ ...baseEvent, type: 'delivered' } as DeliveryEvent);
            break;
          case 'hard_bounce':
            await options.onEvent({
              ...baseEvent,
              type: 'bounced',
              bounceType: 'hard',
              bounceReason: msg.bounce_description,
              diagnosticCode: msg.diag,
            } as BounceEvent);
            break;
          case 'soft_bounce':
            await options.onEvent({
              ...baseEvent,
              type: 'bounced',
              bounceType: 'soft',
              bounceReason: msg.bounce_description,
            } as BounceEvent);
            break;
          case 'open':
            await options.onEvent({
              ...baseEvent,
              type: 'opened',
              userAgent: msg.user_agent,
              ipAddress: msg.ip,
            } as OpenEvent);
            break;
          case 'click':
            await options.onEvent({
              ...baseEvent,
              type: 'clicked',
              url: mcEvent.url,
              userAgent: msg.user_agent,
              ipAddress: msg.ip,
            } as ClickEvent);
            break;
          case 'spam':
            await options.onEvent({ ...baseEvent, type: 'complained' });
            break;
          case 'unsub':
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
