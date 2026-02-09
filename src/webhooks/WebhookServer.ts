import express, { Express } from 'express';
import http from 'http';
import { WebhookServerOptions, WebhookCallbacks } from '../types/webhook.types';
import { TrackingCallbacks, TrackingEventData, DeliveryEvent, BounceEvent, OpenEvent, ClickEvent, TrackingEvent } from '../types/tracking.types';
import { EmailProvider } from '../types/core.types';
import { createSESIncomingHandler, createSESEventHandler } from './ses';
import { createMailgunIncomingHandler, createMailgunEventHandler } from './mailgun';
import { createSendGridIncomingHandler, createSendGridEventHandler } from './sendgrid';
import { createMailchimpIncomingHandler, createMailchimpEventHandler } from './mailchimp';
import { createOpenTrackingHandler, createClickTrackingHandler } from './tracking';

export class WebhookServer {
  private app: Express;
  private server?: http.Server;
  private webhookCallbacks: WebhookCallbacks;
  private trackingCallbacks?: TrackingCallbacks;
  private basePath: string;

  constructor(private options: WebhookServerOptions) {
    this.app = express();
    this.webhookCallbacks = options.webhookCallbacks;
    this.trackingCallbacks = options.trackingCallbacks;
    this.basePath = options.basePath || '/webhooks';

    this.setupMiddleware();
    this.setupRoutes();
  }

  getApp(): Express {
    return this.app;
  }

  start(): Promise<void> {
    const port = this.options.port || 3000;
    const host = this.options.host || '0.0.0.0';

    return new Promise((resolve) => {
      this.server = this.app.listen(port, host, () => {
        console.log(`Webhook server running on ${host}:${port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private setupMiddleware(): void {
    const maxBody = this.options.maxBodySize || '10mb';
    this.app.use(express.json({ limit: maxBody }));
    this.app.use(express.urlencoded({ extended: true, limit: maxBody }));
  }

  private setupRoutes(): void {
    const bp = this.basePath;

    const incomingOpts = (provider: EmailProvider | 'custom') => ({
      onEmail: async (email: any) => {
        await this.webhookCallbacks.onIncomingEmail?.(email);
      },
      onError: async (error: Error) => {
        await this.webhookCallbacks.onError?.(error, provider);
      },
    });

    const eventOpts = (provider: EmailProvider) => ({
      onEvent: async (event: TrackingEventData) => {
        await this.dispatchTrackingEvent(event);
      },
      onError: async (error: Error) => {
        await this.webhookCallbacks.onError?.(error, provider);
      },
    });

    this.app.post(`${bp}/ses/incoming`, createSESIncomingHandler(incomingOpts('aws-ses')));
    this.app.post(`${bp}/mailgun/incoming`, createMailgunIncomingHandler({
      ...incomingOpts('mailgun'),
      secret: this.options.webhookSecrets?.mailgun,
    }));
    this.app.post(`${bp}/sendgrid/incoming`, createSendGridIncomingHandler(incomingOpts('sendgrid')));
    this.app.post(`${bp}/mailchimp/incoming`, createMailchimpIncomingHandler(incomingOpts('mailchimp')));

    this.app.post(`${bp}/ses/events`, createSESEventHandler(eventOpts('aws-ses')));
    this.app.post(`${bp}/mailgun/events`, createMailgunEventHandler({
      ...eventOpts('mailgun'),
      secret: this.options.webhookSecrets?.mailgun,
    }));
    this.app.post(`${bp}/sendgrid/events`, createSendGridEventHandler(eventOpts('sendgrid')));
    this.app.post(`${bp}/mailchimp/events`, createMailchimpEventHandler(eventOpts('mailchimp')));

    const trackingEventOpts = {
      onEvent: async (event: TrackingEventData) => {
        await this.dispatchTrackingEvent(event);
      },
    };
    this.app.get('/track/open/:messageId', createOpenTrackingHandler(trackingEventOpts));
    this.app.get('/track/click/:messageId', createClickTrackingHandler(trackingEventOpts));

    this.app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  private async dispatchTrackingEvent(event: TrackingEventData): Promise<void> {
    if (!this.trackingCallbacks) return;

    switch (event.type) {
      case 'delivered':
        await this.trackingCallbacks.onDelivery?.(event as DeliveryEvent);
        break;
      case 'bounced':
        await this.trackingCallbacks.onBounce?.(event as BounceEvent);
        break;
      case 'opened':
        await this.trackingCallbacks.onOpen?.(event as OpenEvent);
        break;
      case 'clicked':
        await this.trackingCallbacks.onClick?.(event as ClickEvent);
        break;
      case 'complained':
        await this.trackingCallbacks.onComplaint?.(event as TrackingEvent);
        break;
      case 'unsubscribed':
        await this.trackingCallbacks.onUnsubscribe?.(event as TrackingEvent);
        break;
    }

    await this.trackingCallbacks.onAny?.(event);
  }
}
