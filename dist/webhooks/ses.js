"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSESIncomingHandler = createSESIncomingHandler;
exports.createSESEventHandler = createSESEventHandler;
const axios_1 = __importDefault(require("axios"));
function createSESIncomingHandler(options) {
    return async (req, res) => {
        try {
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
                await options.onEmail(email);
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
function createSESEventHandler(options) {
    return async (req, res) => {
        try {
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
                            await options.onEvent({
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
                            await options.onEvent({
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
                        });
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
                        });
                        break;
                    }
                }
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
//# sourceMappingURL=ses.js.map