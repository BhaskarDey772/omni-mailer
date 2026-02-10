import { type Express } from 'express';
import type { WebhookServerOptions } from '../types/webhook.types';
export declare class WebhookServer {
    private options;
    private app;
    private server?;
    private webhookCallbacks;
    private trackingCallbacks?;
    private basePath;
    constructor(options: WebhookServerOptions);
    getApp(): Express;
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupMiddleware;
    private setupRoutes;
    private dispatchTrackingEvent;
}
//# sourceMappingURL=WebhookServer.d.ts.map