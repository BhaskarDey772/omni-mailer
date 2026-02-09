"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSendGridIncomingHandler = createSendGridIncomingHandler;
exports.createSendGridEventHandler = createSendGridEventHandler;
function createSendGridIncomingHandler(options) {
    return async (req, res) => {
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
            if (req.body.headers) {
                try {
                    const headers = JSON.parse(req.body.headers);
                    email.messageId = headers['Message-ID'] || '';
                }
                catch { }
            }
            await options.onEmail(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
function createSendGridEventHandler(options) {
    return async (req, res) => {
        try {
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
                        await options.onEvent({
                            ...baseEvent,
                            type: 'delivered',
                            smtpResponse: sgEvent.response,
                        });
                        break;
                    case 'bounce':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: sgEvent.type === 'bounce' ? 'hard' : 'soft',
                            bounceReason: sgEvent.reason,
                        });
                        break;
                    case 'open':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'opened',
                            userAgent: sgEvent.useragent,
                            ipAddress: sgEvent.ip,
                        });
                        break;
                    case 'click':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'clicked',
                            url: sgEvent.url,
                            userAgent: sgEvent.useragent,
                            ipAddress: sgEvent.ip,
                        });
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
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
//# sourceMappingURL=sendgrid.js.map