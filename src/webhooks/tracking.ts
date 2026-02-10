import type { Request, Response } from 'express';
import type { ClickEvent, OpenEvent } from '../types/tracking.types';
import type {
  ClickTrackingHandlerOptions,
  OpenTrackingHandlerOptions,
  WebhookHandler,
} from '../types/webhook.types';

const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export function createOpenTrackingHandler(options: OpenTrackingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      await options.onEvent({
        type: 'opened',
        messageId: decodeURIComponent(messageId),
        provider: 'aws-ses',
        timestamp: new Date(),
        recipient: '',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      } as OpenEvent);
    } catch {}

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': TRACKING_PIXEL.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(TRACKING_PIXEL);
  };
}

export function createClickTrackingHandler(options: ClickTrackingHandlerOptions): WebhookHandler {
  return async (req: Request, res: Response): Promise<void> => {
    const { messageId } = req.params;
    const url = req.query.url as string;

    try {
      await options.onEvent({
        type: 'clicked',
        messageId: decodeURIComponent(messageId),
        provider: 'aws-ses',
        timestamp: new Date(),
        recipient: '',
        url: url || '',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      } as ClickEvent);
    } catch {}

    if (url) {
      res.redirect(302, url);
    } else {
      res.status(400).send('Missing URL');
    }
  };
}
