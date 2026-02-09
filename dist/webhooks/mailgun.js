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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMailgunIncomingHandler = createMailgunIncomingHandler;
exports.createMailgunEventHandler = createMailgunEventHandler;
const crypto = __importStar(require("crypto"));
function createMailgunIncomingHandler(options) {
    return async (req, res) => {
        try {
            if (options.secret) {
                const { timestamp, token, signature } = req.body;
                const hmac = crypto
                    .createHmac('sha256', options.secret)
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
            await options.onEmail(email);
            res.status(200).send('OK');
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
function createMailgunEventHandler(options) {
    return async (req, res) => {
        try {
            if (options.secret) {
                const sig = req.body.signature;
                if (sig) {
                    const hmac = crypto
                        .createHmac('sha256', options.secret)
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
                    await options.onEvent({ ...baseEvent, type: 'delivered' });
                    break;
                case 'failed':
                    await options.onEvent({
                        ...baseEvent,
                        type: 'bounced',
                        bounceType: eventData.severity === 'permanent' ? 'hard' : 'soft',
                        bounceReason: eventData.reason,
                    });
                    break;
                case 'opened':
                    await options.onEvent({
                        ...baseEvent,
                        type: 'opened',
                        userAgent: eventData['user-agent'],
                        ipAddress: eventData.ip,
                    });
                    break;
                case 'clicked':
                    await options.onEvent({
                        ...baseEvent,
                        type: 'clicked',
                        url: eventData.url,
                        userAgent: eventData['user-agent'],
                        ipAddress: eventData.ip,
                    });
                    break;
                case 'complained':
                    await options.onEvent({ ...baseEvent, type: 'complained' });
                    break;
                case 'unsubscribed':
                    await options.onEvent({ ...baseEvent, type: 'unsubscribed' });
                    break;
            }
            res.status(200).send('OK');
        }
        catch (error) {
            await options.onError?.(error);
            res.status(500).json({ error: error.message });
        }
    };
}
//# sourceMappingURL=mailgun.js.map