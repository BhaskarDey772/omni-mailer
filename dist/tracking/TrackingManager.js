"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingManager = void 0;
/**
 * Manages open-pixel injection and click-link rewriting.
 * The actual tracking endpoints live in the WebhookServer.
 */
class TrackingManager {
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    }
    /** Inject a 1x1 transparent tracking pixel at the end of the HTML body */
    injectOpenPixel(html, messageId) {
        if (!messageId)
            return html;
        const pixelUrl = `${this.baseUrl}/track/open/${encodeURIComponent(messageId)}`;
        const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
        // Insert before </body> if present, otherwise append
        if (html.includes('</body>')) {
            return html.replace('</body>', `${pixel}</body>`);
        }
        return html + pixel;
    }
    /** Rewrite all <a href="..."> links to pass through the tracking endpoint */
    rewriteLinks(html, messageId) {
        if (!messageId)
            return html;
        return html.replace(/<a\s([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (_match, before, url, after) => {
            // Skip mailto:, tel:, and anchor links
            if (/^(mailto:|tel:|#)/.test(url))
                return _match;
            // Skip tracking URLs to avoid loops
            if (url.startsWith(this.baseUrl))
                return _match;
            const trackUrl = `${this.baseUrl}/track/click/${encodeURIComponent(messageId)}?url=${encodeURIComponent(url)}`;
            return `<a ${before}href="${trackUrl}"${after}>`;
        });
    }
}
exports.TrackingManager = TrackingManager;
//# sourceMappingURL=TrackingManager.js.map