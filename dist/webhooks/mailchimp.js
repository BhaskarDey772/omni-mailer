"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMailchimpIncomingHandler = createMailchimpIncomingHandler;
exports.createMailchimpEventHandler = createMailchimpEventHandler;
function createMailchimpIncomingHandler(options) {
    return async (req, res) => {
        try {
            const email = {
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
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
function createMailchimpEventHandler(options) {
    return async (req, res) => {
        try {
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
                        await options.onEvent({ ...baseEvent, type: 'delivered' });
                        break;
                    case 'hard_bounce':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'hard',
                            bounceReason: msg.bounce_description,
                            diagnosticCode: msg.diag,
                        });
                        break;
                    case 'soft_bounce':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'bounced',
                            bounceType: 'soft',
                            bounceReason: msg.bounce_description,
                        });
                        break;
                    case 'open':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'opened',
                            userAgent: msg.user_agent,
                            ipAddress: msg.ip,
                        });
                        break;
                    case 'click':
                        await options.onEvent({
                            ...baseEvent,
                            type: 'clicked',
                            url: mcEvent.url,
                            userAgent: msg.user_agent,
                            ipAddress: msg.ip,
                        });
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
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
//# sourceMappingURL=mailchimp.js.map