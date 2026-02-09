"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookError = exports.ProviderError = exports.ValidationError = exports.EmailError = exports.ConfigValidator = exports.AttachmentHandler = exports.TrackingManager = exports.WebhookServer = exports.BaseEmailClient = exports.ZohoEmailClient = exports.MailchimpEmailClient = exports.SendGridEmailClient = exports.MailgunEmailClient = exports.SESEmailClient = void 0;
// ── Provider Clients ────────────────────────────────────
var SESEmailClient_1 = require("./providers/ses/SESEmailClient");
Object.defineProperty(exports, "SESEmailClient", { enumerable: true, get: function () { return SESEmailClient_1.SESEmailClient; } });
var MailgunEmailClient_1 = require("./providers/mailgun/MailgunEmailClient");
Object.defineProperty(exports, "MailgunEmailClient", { enumerable: true, get: function () { return MailgunEmailClient_1.MailgunEmailClient; } });
var SendGridEmailClient_1 = require("./providers/sendgrid/SendGridEmailClient");
Object.defineProperty(exports, "SendGridEmailClient", { enumerable: true, get: function () { return SendGridEmailClient_1.SendGridEmailClient; } });
var MailchimpEmailClient_1 = require("./providers/mailchimp/MailchimpEmailClient");
Object.defineProperty(exports, "MailchimpEmailClient", { enumerable: true, get: function () { return MailchimpEmailClient_1.MailchimpEmailClient; } });
var ZohoEmailClient_1 = require("./providers/zoho/ZohoEmailClient");
Object.defineProperty(exports, "ZohoEmailClient", { enumerable: true, get: function () { return ZohoEmailClient_1.ZohoEmailClient; } });
// ── Base Client (for extending with custom providers) ───
var BaseEmailClient_1 = require("./core/BaseEmailClient");
Object.defineProperty(exports, "BaseEmailClient", { enumerable: true, get: function () { return BaseEmailClient_1.BaseEmailClient; } });
// ── Webhook Server ──────────────────────────────────────
var WebhookServer_1 = require("./webhooks/WebhookServer");
Object.defineProperty(exports, "WebhookServer", { enumerable: true, get: function () { return WebhookServer_1.WebhookServer; } });
// ── Tracking ────────────────────────────────────────────
var TrackingManager_1 = require("./tracking/TrackingManager");
Object.defineProperty(exports, "TrackingManager", { enumerable: true, get: function () { return TrackingManager_1.TrackingManager; } });
// ── Attachments ─────────────────────────────────────────
var AttachmentHandler_1 = require("./attachments/AttachmentHandler");
Object.defineProperty(exports, "AttachmentHandler", { enumerable: true, get: function () { return AttachmentHandler_1.AttachmentHandler; } });
// ── Utilities ───────────────────────────────────────────
var ConfigValidator_1 = require("./utils/ConfigValidator");
Object.defineProperty(exports, "ConfigValidator", { enumerable: true, get: function () { return ConfigValidator_1.ConfigValidator; } });
// ── Errors ──────────────────────────────────────────────
var errors_1 = require("./errors");
Object.defineProperty(exports, "EmailError", { enumerable: true, get: function () { return errors_1.EmailError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "ProviderError", { enumerable: true, get: function () { return errors_1.ProviderError; } });
Object.defineProperty(exports, "WebhookError", { enumerable: true, get: function () { return errors_1.WebhookError; } });
//# sourceMappingURL=index.js.map