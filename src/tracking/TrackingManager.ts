import type { TrackingConfig } from '../types/tracking.types';

export class TrackingManager {
  private baseUrl: string;

  constructor(config: TrackingConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
  }

  injectOpenPixel(html: string, messageId: string): string {
    if (!messageId) return html;
    const pixelUrl = `${this.baseUrl}/track/open/${encodeURIComponent(messageId)}`;
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixel}</body>`);
    }
    return html + pixel;
  }

  rewriteLinks(html: string, messageId: string): string {
    if (!messageId) return html;

    return html.replace(
      /<a\s([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
      (_match, before: string, url: string, after: string) => {
        if (/^(mailto:|tel:|#)/.test(url)) return _match;
        if (url.startsWith(this.baseUrl)) return _match;

        const trackUrl = `${this.baseUrl}/track/click/${encodeURIComponent(messageId)}?url=${encodeURIComponent(url)}`;
        return `<a ${before}href="${trackUrl}"${after}>`;
      },
    );
  }
}
