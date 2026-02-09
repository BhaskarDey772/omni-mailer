"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookServer = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
class WebhookServer {
    constructor(options) {
        this.options = options;
        this.app = (0, express_1.default)();
        this.webhookCallbacks = options.webhookCallbacks;
        this.trackingCallbacks = options.trackingCallbacks;
        this.trackingConfig = options.trackingConfig;
        this.webhookSecrets = options.webhookSecrets;
        this.basePath = options.basePath || '/webhooks';
        this.setupMiddleware();
        this.setupIncomingRoutes();
        this.setupTrackingEventRoutes();
        this.setupTrackingPixelRoutes();
        this.setupHealthCheck();
    }
    /** Get the underlying Express app (to mount on your own server) */
    getApp() {
        return this.app;
    }
    /** Start as standalone server */
    start() {
        const port = this.options.port || 3000;
        const host = this.options.host || '0.0.0.0';
        return new Promise((resolve) => {
            this.server = this.app.listen(port, host, () => {
                console.log(`Webhook server running on ${host}:${port}`);
                console.log(`Incoming email endpoints:`);
                console.log(`  SES:       POST ${this.basePath}/ses/incoming`);
                console.log(`  Mailgun:   POST ${this.basePath}/mailgun/incoming`);
                console.log(`  SendGrid:  POST ${this.basePath}/sendgrid/incoming`);
                console.log(`  Mailchimp: POST ${this.basePath}/mailchimp/incoming`);
                console.log(`  Custom:    POST ${this.basePath}/custom/incoming`);
                console.log(`Tracking event endpoints:`);
                console.log(`  SES:       POST ${this.basePath}/ses/events`);
                console.log(`  Mailgun:   POST ${this.basePath}/mailgun/events`);
                console.log(`  SendGrid:  POST ${this.basePath}/sendgrid/events`);
                console.log(`  Mailchimp: POST ${this.basePath}/mailchimp/events`);
                console.log(`Tracking pixel/click:`);
                console.log(`  Open:      GET  /track/open/:messageId`);
                console.log(`  Click:     GET  /track/click/:messageId`);
                resolve();
            });
        });
    }
    /** Stop the server */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server)
                return resolve();
            this.server.close((err) => (err ? reject(err) : resolve()));
        });
    }
    // ─── Middleware ───────────────────────────────────────────
    setupMiddleware() {
        const maxBody = this.options.maxBodySize || '10mb';
        this.app.use(express_1.default.json({ limit: maxBody }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: maxBody }));
    }
    // ─── Incoming Email Routes ────────────────────────────────
    setupIncomingRoutes() {
        const bp = this.basePath;
        this.app.post(`${bp}/ses/incoming`, this.handleSESIncoming.bind(this));
        this.app.post(`${bp}/mailgun/incoming`, this.handleMailgunIncoming.bind(this));
        this.app.post(`${bp}/sendgrid/incoming`, this.handleSendGridIncoming.bind(this));
        this.app.post(`${bp}/mailchimp/incoming`, this.handleMailchimpIncoming.bind(this));
        this.app.post(`${bp}/custom/incoming`, this.handleCustomIncoming.bind(this));
    }
    async handleSESIncoming(req, res) {
        try {
            // Handle SNS subscription confirmation
            if (req.body.Type === 'SubscriptionConfirmation') {
                if (req.body.SubscribeURL) {
                    await axios_1.default.get(req.body.SubscribeURL);
                }
                res.status(200).send('OK');
                return;
            }
            if (req.body.Type === 'Notification') {
                const message = JSON.parse(req.body.Message);
                const mail = message.mail;
                const email = {
                    provider: 'aws-ses',
                    from: mail.commonHeaders?.from?.[0] || mail.source,
                    to: mail.commonHeaders?.to || mail.destination,
                    subject: mail.commonHeaders?.subject || '',
                    messageId: mail.messageId,
                    timestamp: new Date(mail.timestamp),
                    headers: mail.headers?.reduce((acc, h) => {
                        acc[h.name] = h.value;
                        return acc;
                    }, {}),
                };
                await this.emitIncoming(email);
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'aws-ses');
            res.status(500).json({ error: error.message });
        }
    }
    async handleMailgunIncoming(req, res) {
        try {
            // Verify signature if secret provided
            if (this.webhookSecrets?.mailgun) {
                const { timestamp, token, signature } = req.body;
                const hmac = crypto
                    .createHmac('sha256', this.webhookSecrets.mailgun)
                    .update(timestamp + token)
                    .digest('hex');
                if (hmac !== signature) {
                    res.status(403).json({ error: 'Invalid signature' });
                    return;
                }
            }
            const email = {
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
            await this.emitIncoming(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'mailgun');
            res.status(500).json({ error: error.message });
        }
    }
    async handleSendGridIncoming(req, res) {
        try {
            const email = {
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
            // Extract messageId from headers
            if (req.body.headers) {
                try {
                    const headers = JSON.parse(req.body.headers);
                    email.messageId = headers['Message-ID'] || '';
                }
                catch {
                    // headers might not be JSON
                }
            }
            await this.emitIncoming(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'sendgrid');
            res.status(500).json({ error: error.message });
        }
    }
    async handleMailchimpIncoming(req, res) {
        try {
            const email = {
                provider: 'mailchimp',
                from: req.body.from_email || req.body.msg?.from_email || '',
                to: req.body.to ? [req.body.to] : [],
                subject: req.body.subject || req.body.msg?.subject || '',
                text: req.body.text || req.body.msg?.text,
                html: req.body.html || req.body.msg?.html,
                messageId: req.body.msg?._id || '',
                timestamp: req.body.ts
                    ? new Date(req.body.ts * 1000)
                    : new Date(),
            };
            await this.emitIncoming(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'mailchimp');
            res.status(500).json({ error: error.message });
        }
    }
    async handleCustomIncoming(req, res) {
        try {
            const body = req.body;
            const email = {
                provider: 'custom',
                from: body.from || '',
                to: Array.isArray(body.to) ? body.to : [body.to || ''],
                subject: body.subject || '',
                text: body.text || body.body,
                html: body.html,
                messageId: body.messageId || body.message_id || '',
                inReplyTo: body.inReplyTo || body.in_reply_to,
                timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
                raw: body.raw,
            };
            await this.emitIncoming(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'custom');
            res.status(500).json({ error: error.message });
        }
    }
    // ─── Tracking Event Routes ───────────────────────────────
    setupTrackingEventRoutes() {
        const bp = this.basePath;
        this.app.post(`${bp}/ses/events`, this.handleSESEvents.bind(this));
        this.app.post(`${bp}/mailgun/events`, this.handleMailgunEvents.bind(this));
        this.app.post(`${bp}/sendgrid/events`, this.handleSendGridEvents.bind(this));
        this.app.post(`${bp}/mailchimp/events`, this.handleMailchimpEvents.bind(this));
    }
    async handleSESEvents(req, res) {
        try {
            // Handle SNS subscription confirmation
            if (req.body.Type === 'SubscriptionConfirmation') {
                if (req.body.SubscribeURL) {
                    await axios_1.default.get(req.body.SubscribeURL);
                }
                res.status(200).send('OK');
                return;
            }
            if (req.body.Type === 'Notification') {
                const message = JSON.parse(req.body.Message);
                const eventType = message.eventType || message.notificationType;
                const baseEvent = {
                    provider: 'aws-ses',
                    messageId: message.mail?.messageId || '',
                    timestamp: new Date(message.mail?.timestamp || Date.now()),
                    recipient: '',
                };
                switch (eventType) {
                    case 'Delivery': {
                        const recipients = message.delivery?.recipients || [];
                        for (const recipient of recipients) {
                            await this.emitTrackingEvent({
                                ...baseEvent,
                                type: 'delivered',
                                recipient,
                                smtpResponse: message.delivery?.smtpResponse,
                            });
                        }
                        break;
                    }
                    case 'Bounce': {
                        const bouncedRecipients = message.bounce?.bouncedRecipients || [];
                        for (const r of bouncedRecipients) {
                            await this.emitTrackingEvent({
                                ...baseEvent,
                                type: 'bounced',
                                recipient: r.emailAddress,
                                bounceType: message.bounce?.bounceType === 'Permanent' ? 'hard' : 'soft',
                                bounceReason: r.diagnosticCode,
                                diagnosticCode: r.diagnosticCode,
                            });
                        }
                        break;
                    }
                    case 'Complaint': {
                        const complainedRecipients = message.complaint?.complainedRecipients || [];
                        for (const r of complainedRecipients) {
                            await this.emitTrackingEvent({
                                ...baseEvent,
                                type: 'complained',
                                recipient: r.emailAddress,
                            });
                        }
                        break;
                    }
                    case 'Open': {
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'opened',
                            recipient: message.open?.ipAddress || '',
                            userAgent: message.open?.userAgent,
                            ipAddress: message.open?.ipAddress,
                        });
                        break;
                    }
                    case 'Click': {
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'clicked',
                            recipient: message.click?.ipAddress || '',
                            url: message.click?.link,
                            userAgent: message.click?.userAgent,
                            ipAddress: message.click?.ipAddress,
                        });
                        break;
                    }
                }
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'aws-ses');
            res.status(500).json({ error: error.message });
        }
    }
    async handleMailgunEvents(req, res) {
        try {
            // Verify signature
            if (this.webhookSecrets?.mailgun) {
                const sig = req.body.signature;
                if (sig) {
                    const hmac = crypto
                        .createHmac('sha256', this.webhookSecrets.mailgun)
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
                provider: 'mailgun',
                messageId: eventData.message?.headers?.['message-id'] || '',
                timestamp: new Date((eventData.timestamp || 0) * 1000),
                recipient: eventData.recipient || '',
            };
            switch (event) {
                case 'delivered':
                    await this.emitTrackingEvent({
                        ...baseEvent,
                        type: 'delivered',
                    });
                    break;
                case 'failed':
                    if (eventData.severity === 'permanent') {
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'hard',
                            bounceReason: eventData.reason,
                        });
                    }
                    else {
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'soft',
                            bounceReason: eventData.reason,
                        });
                    }
                    break;
                case 'opened':
                    await this.emitTrackingEvent({
                        ...baseEvent,
                        type: 'opened',
                        userAgent: eventData['user-agent'],
                        ipAddress: eventData.ip,
                    });
                    break;
                case 'clicked':
                    await this.emitTrackingEvent({
                        ...baseEvent,
                        type: 'clicked',
                        url: eventData.url,
                        userAgent: eventData['user-agent'],
                        ipAddress: eventData.ip,
                    });
                    break;
                case 'complained':
                    await this.emitTrackingEvent({ ...baseEvent, type: 'complained' });
                    break;
                case 'unsubscribed':
                    await this.emitTrackingEvent({ ...baseEvent, type: 'unsubscribed' });
                    break;
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'mailgun');
            res.status(500).json({ error: error.message });
        }
    }
    async handleSendGridEvents(req, res) {
        try {
            // SendGrid sends an array of events
            const events = Array.isArray(req.body) ? req.body : [req.body];
            for (const sgEvent of events) {
                const baseEvent = {
                    provider: 'sendgrid',
                    messageId: sgEvent.sg_message_id || '',
                    timestamp: new Date((sgEvent.timestamp || 0) * 1000),
                    recipient: sgEvent.email || '',
                };
                switch (sgEvent.event) {
                    case 'delivered':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'delivered',
                            smtpResponse: sgEvent.response,
                        });
                        break;
                    case 'bounce':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: sgEvent.type === 'bounce' ? 'hard' : 'soft',
                            bounceReason: sgEvent.reason,
                        });
                        break;
                    case 'open':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'opened',
                            userAgent: sgEvent.useragent,
                            ipAddress: sgEvent.ip,
                        });
                        break;
                    case 'click':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'clicked',
                            url: sgEvent.url,
                            userAgent: sgEvent.useragent,
                            ipAddress: sgEvent.ip,
                        });
                        break;
                    case 'spamreport':
                        await this.emitTrackingEvent({ ...baseEvent, type: 'complained' });
                        break;
                    case 'unsubscribe':
                    case 'group_unsubscribe':
                        await this.emitTrackingEvent({ ...baseEvent, type: 'unsubscribed' });
                        break;
                }
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'sendgrid');
            res.status(500).json({ error: error.message });
        }
    }
    async handleMailchimpEvents(req, res) {
        try {
            // Mandrill webhooks send events as mandrill_events form param
            let events = req.body;
            if (req.body.mandrill_events) {
                events = JSON.parse(req.body.mandrill_events);
            }
            if (!Array.isArray(events))
                events = [events];
            for (const mcEvent of events) {
                const msg = mcEvent.msg || {};
                const baseEvent = {
                    provider: 'mailchimp',
                    messageId: msg._id || '',
                    timestamp: new Date((mcEvent.ts || 0) * 1000),
                    recipient: msg.email || '',
                };
                switch (mcEvent.event) {
                    case 'send':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'delivered',
                        });
                        break;
                    case 'hard_bounce':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'hard',
                            bounceReason: msg.bounce_description,
                            diagnosticCode: msg.diag,
                        });
                        break;
                    case 'soft_bounce':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'soft',
                            bounceReason: msg.bounce_description,
                        });
                        break;
                    case 'open':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'opened',
                            userAgent: msg.user_agent,
                            ipAddress: msg.ip,
                        });
                        break;
                    case 'click':
                        await this.emitTrackingEvent({
                            ...baseEvent,
                            type: 'clicked',
                            url: mcEvent.url,
                            userAgent: msg.user_agent,
                            ipAddress: msg.ip,
                        });
                        break;
                    case 'spam':
                        await this.emitTrackingEvent({ ...baseEvent, type: 'complained' });
                        break;
                    case 'unsub':
                        await this.emitTrackingEvent({ ...baseEvent, type: 'unsubscribed' });
                        break;
                }
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await this.emitError(error, 'mailchimp');
            res.status(500).json({ error: error.message });
        }
    }
    // ─── Open / Click Tracking Routes ────────────────────────
    setupTrackingPixelRoutes() {
        this.app.get('/track/open/:messageId', this.handleOpenTracking.bind(this));
        this.app.get('/track/click/:messageId', this.handleClickTracking.bind(this));
    }
    async handleOpenTracking(req, res) {
        try {
            const { messageId } = req.params;
            await this.emitTrackingEvent({
                type: 'opened',
                messageId: decodeURIComponent(messageId),
                provider: 'aws-ses', // custom tracking, provider unknown
                timestamp: new Date(),
                recipient: '',
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            });
        }
        catch {
            // Don't fail the pixel response
        }
        // Always return the tracking pixel
        res.set({
            'Content-Type': 'image/gif',
            'Content-Length': TRACKING_PIXEL.length.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        });
        res.end(TRACKING_PIXEL);
    }
    async handleClickTracking(req, res) {
        const { messageId } = req.params;
        const url = req.query.url;
        try {
            await this.emitTrackingEvent({
                type: 'clicked',
                messageId: decodeURIComponent(messageId),
                provider: 'aws-ses',
                timestamp: new Date(),
                recipient: '',
                url: url || '',
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            });
        }
        catch {
            // Don't block redirect
        }
        if (url) {
            res.redirect(302, url);
        }
        else {
            res.status(400).send('Missing URL');
        }
    }
    // ─── Health Check ────────────────────────────────────────
    setupHealthCheck() {
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                endpoints: {
                    incoming: [
                        `${this.basePath}/ses/incoming`,
                        `${this.basePath}/mailgun/incoming`,
                        `${this.basePath}/sendgrid/incoming`,
                        `${this.basePath}/mailchimp/incoming`,
                        `${this.basePath}/custom/incoming`,
                    ],
                    events: [
                        `${this.basePath}/ses/events`,
                        `${this.basePath}/mailgun/events`,
                        `${this.basePath}/sendgrid/events`,
                        `${this.basePath}/mailchimp/events`,
                    ],
                    tracking: ['/track/open/:messageId', '/track/click/:messageId'],
                },
            });
        });
    }
    // ─── Event Emitters ──────────────────────────────────────
    async emitIncoming(email) {
        if (this.webhookCallbacks.onIncomingEmail) {
            await this.webhookCallbacks.onIncomingEmail(email);
        }
    }
    async emitTrackingEvent(event) {
        if (!this.trackingCallbacks)
            return;
        // Fire type-specific callback
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
        // Fire catch-all callback
        await this.trackingCallbacks.onAny?.(event);
    }
    async emitError(error, provider) {
        if (this.webhookCallbacks.onError) {
            await this.webhookCallbacks.onError(error, provider);
        }
    }
}
exports.WebhookServer = WebhookServer;
//# sourceMappingURL=WebhookServer.js.map