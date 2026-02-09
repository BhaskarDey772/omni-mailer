"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookServer = void 0;
const express_1 = __importDefault(require("express"));
const ses_1 = require("./ses");
const mailgun_1 = require("./mailgun");
const sendgrid_1 = require("./sendgrid");
const mailchimp_1 = require("./mailchimp");
const tracking_1 = require("./tracking");
class WebhookServer {
    constructor(options) {
        this.options = options;
        this.app = (0, express_1.default)();
        this.webhookCallbacks = options.webhookCallbacks;
        this.trackingCallbacks = options.trackingCallbacks;
        this.basePath = options.basePath || '/webhooks';
        this.setupMiddleware();
        this.setupRoutes();
    }
    getApp() {
        return this.app;
    }
    start() {
        const port = this.options.port || 3000;
        const host = this.options.host || '0.0.0.0';
        return new Promise((resolve) => {
            this.server = this.app.listen(port, host, () => {
                console.log(`Webhook server running on ${host}:${port}`);
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server)
                return resolve();
            this.server.close((err) => (err ? reject(err) : resolve()));
        });
    }
    setupMiddleware() {
        const maxBody = this.options.maxBodySize || '10mb';
        this.app.use(express_1.default.json({ limit: maxBody }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: maxBody }));
    }
    setupRoutes() {
        const bp = this.basePath;
        const incomingOpts = (provider) => ({
            onEmail: async (email) => {
                await this.webhookCallbacks.onIncomingEmail?.(email);
            },
            onError: async (error) => {
                await this.webhookCallbacks.onError?.(error, provider);
            },
        });
        const eventOpts = (provider) => ({
            onEvent: async (event) => {
                await this.dispatchTrackingEvent(event);
            },
            onError: async (error) => {
                await this.webhookCallbacks.onError?.(error, provider);
            },
        });
        this.app.post(`${bp}/ses/incoming`, (0, ses_1.createSESIncomingHandler)(incomingOpts('aws-ses')));
        this.app.post(`${bp}/mailgun/incoming`, (0, mailgun_1.createMailgunIncomingHandler)({
            ...incomingOpts('mailgun'),
            secret: this.options.webhookSecrets?.mailgun,
        }));
        this.app.post(`${bp}/sendgrid/incoming`, (0, sendgrid_1.createSendGridIncomingHandler)(incomingOpts('sendgrid')));
        this.app.post(`${bp}/mailchimp/incoming`, (0, mailchimp_1.createMailchimpIncomingHandler)(incomingOpts('mailchimp')));
        this.app.post(`${bp}/ses/events`, (0, ses_1.createSESEventHandler)(eventOpts('aws-ses')));
        this.app.post(`${bp}/mailgun/events`, (0, mailgun_1.createMailgunEventHandler)({
            ...eventOpts('mailgun'),
            secret: this.options.webhookSecrets?.mailgun,
        }));
        this.app.post(`${bp}/sendgrid/events`, (0, sendgrid_1.createSendGridEventHandler)(eventOpts('sendgrid')));
        this.app.post(`${bp}/mailchimp/events`, (0, mailchimp_1.createMailchimpEventHandler)(eventOpts('mailchimp')));
        const trackingEventOpts = {
            onEvent: async (event) => {
                await this.dispatchTrackingEvent(event);
            },
        };
        this.app.get('/track/open/:messageId', (0, tracking_1.createOpenTrackingHandler)(trackingEventOpts));
        this.app.get('/track/click/:messageId', (0, tracking_1.createClickTrackingHandler)(trackingEventOpts));
        this.app.get('/health', (_req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
    }
    async dispatchTrackingEvent(event) {
        if (!this.trackingCallbacks)
            return;
        switch (event.type) {
            case 'delivered':
                await this.trackingCallbacks.onDelivery?.(event);
                break;
            case 'bounced':
                await this.trackingCallbacks.onBounce?.(event);
                break;
            case 'opened':
                await this.trackingCallbacks.onOpen?.(event);
                break;
            case 'clicked':
                await this.trackingCallbacks.onClick?.(event);
                break;
            case 'complained':
                await this.trackingCallbacks.onComplaint?.(event);
                break;
            case 'unsubscribed':
                await this.trackingCallbacks.onUnsubscribe?.(event);
                break;
        }
        await this.trackingCallbacks.onAny?.(event);
    }
}
exports.WebhookServer = WebhookServer;
//# sourceMappingURL=WebhookServer.js.map