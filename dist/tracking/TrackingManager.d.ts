import type { TrackingConfig } from '../types/tracking.types';
export declare class TrackingManager {
    private baseUrl;
    constructor(config: TrackingConfig);
    injectOpenPixel(html: string, messageId: string): string;
    rewriteLinks(html: string, messageId: string): string;
}
//# sourceMappingURL=TrackingManager.d.ts.map