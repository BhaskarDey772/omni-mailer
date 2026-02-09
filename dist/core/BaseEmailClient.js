"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEmailClient = void 0;
const AttachmentHandler_1 = require("../attachments/AttachmentHandler");
const TrackingManager_1 = require("../tracking/TrackingManager");
class BaseEmailClient {
    constructor(provider) {
        this.provider = provider;
    }
    /** Enable open/click tracking for emails sent through this client */
    enableTracking(config) {
        this.trackingManager = new TrackingManager_1.TrackingManager(config);
    }
    /** Send emails in bulk with concurrency control */
    async sendBulk(emails, options = {}) {
        const { concurrency = 5, delayMs = 100, retryAttempts = 0, onProgress } = options;
        const results = [];
        const startTime = Date.now();
        for (let i = 0; i < emails.length; i += concurrency) {
            const batch = emails.slice(i, i + concurrency);
            const batchResults = await Promise.all(batch.map((email) => this.sendWithRetry(email, retryAttempts)));
            results.push(...batchResults);
            if (onProgress) {
                onProgress({
                    total: emails.length,
                    sent: Math.min(i + concurrency, emails.length),
                    successful: results.filter((r) => r.success).length,
                    failed: results.filter((r) => !r.success).length,
                });
            }
            if (i + concurrency < emails.length && delayMs > 0) {
                await this.delay(delayMs);
            }
        }
        return {
            total: emails.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
            durationMs: Date.now() - startTime,
        };
    }
    /** Retry a send operation with exponential backoff */
    async sendWithRetry(emailData, maxRetries) {
        let lastResult;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            lastResult = await this.send(emailData);
            if (lastResult.success)
                return lastResult;
            if (attempt < maxRetries) {
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
        return lastResult;
    }
    /** Apply tracking (open pixel + click rewriting) to HTML content */
    applyTracking(html, emailData) {
        if (!this.trackingManager || !html)
            return html;
        let tracked = html;
        if (emailData.trackOpens !== false) {
            tracked = this.trackingManager.injectOpenPixel(tracked, emailData.metadata?.messageId || '');
        }
        if (emailData.trackClicks !== false) {
            tracked = this.trackingManager.rewriteLinks(tracked, emailData.metadata?.messageId || '');
        }
        return tracked;
    }
    /** Process attachments from user input to provider-ready format */
    async processAttachments(attachments) {
        if (!attachments || attachments.length === 0)
            return [];
        return AttachmentHandler_1.AttachmentHandler.processAll(attachments);
    }
    /** Normalize email recipient to string */
    toEmailString(recipient) {
        if (typeof recipient === 'string')
            return recipient;
        return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
    }
    /** Normalize recipients to string array */
    toEmailStrings(recipients) {
        if (Array.isArray(recipients)) {
            return recipients.map((r) => this.toEmailString(r));
        }
        return [this.toEmailString(recipients)];
    }
    /** Normalize recipient to raw email address only */
    toRawEmail(recipient) {
        if (typeof recipient === 'string')
            return recipient;
        return recipient.email;
    }
    /** Normalize recipients to raw email array */
    toRawEmails(recipients) {
        if (Array.isArray(recipients)) {
            return recipients.map((r) => this.toRawEmail(r));
        }
        return [this.toRawEmail(recipients)];
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.BaseEmailClient = BaseEmailClient;
//# sourceMappingURL=BaseEmailClient.js.map