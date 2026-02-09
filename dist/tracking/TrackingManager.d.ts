import { TrackingConfig } from '../types/tracking.types';
/**
 * Manages open-pixel injection and click-link rewriting.
 * The actual tracking endpoints live in the WebhookServer.
 */
export declare class TrackingManager {
    private baseUrl;
    constructor(config: TrackingConfig);
    /** Inject a 1x1 transparent tracking pixel at the end of the HTML body */
    injectOpenPixel(html: string, messageId: string): string;
    /** Rewrite all <a href="..."> links to pass through the tracking endpoint */
    rewriteLinks(html: string, messageId: string): string;
}
//# sourceMappingURL=TrackingManager.d.ts.map