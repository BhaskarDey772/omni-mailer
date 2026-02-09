import { Express } from 'express';
import { WebhookServerOptions } from '../types/webhook.types';
export declare class WebhookServer {
    private options;
    private app;
    private server?;
    private webhookCallbacks;
    private trackingCallbacks?;
    private trackingConfig?;
    private webhookSecrets?;
    private basePath;
    constructor(options: WebhookServerOptions);
    /** Get the underlying Express app (to mount on your own server) */
    getApp(): Express;
    /** Start as standalone server */
    start(): Promise<void>;
    /** Stop the server */
    stop(): Promise<void>;
    private setupMiddleware;
    private setupIncomingRoutes;
    private handleSESIncoming;
    private handleMailgunIncoming;
    private handleSendGridIncoming;
    private handleMailchimpIncoming;
    private handleCustomIncoming;
    private setupTrackingEventRoutes;
    private handleSESEvents;
    private handleMailgunEvents;
    private handleSendGridEvents;
    private handleMailchimpEvents;
    private setupTrackingPixelRoutes;
    private handleOpenTracking;
    private handleClickTracking;
    private setupHealthCheck;
    private emitIncoming;
    private emitTrackingEvent;
    private emitError;
}
//# sourceMappingURL=WebhookServer.d.ts.map