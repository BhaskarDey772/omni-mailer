"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenTrackingHandler = createOpenTrackingHandler;
exports.createClickTrackingHandler = createClickTrackingHandler;
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
function createOpenTrackingHandler(options) {
    return async (req, res) => {
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
            });
        }
        catch { }
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
function createClickTrackingHandler(options) {
    return async (req, res) => {
        const { messageId } = req.params;
        const url = req.query.url;
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
            });
        }
        catch { }
        if (url) {
            res.redirect(302, url);
        }
        else {
            res.status(400).send('Missing URL');
        }
    };
}
//# sourceMappingURL=tracking.js.map