"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoEmailClient = exports.MailchimpEmailClient = exports.SendGridEmailClient = exports.MailgunEmailClient = exports.SESEmailClient = void 0;
var SESEmailClient_1 = require("./ses/SESEmailClient");
Object.defineProperty(exports, "SESEmailClient", { enumerable: true, get: function () { return SESEmailClient_1.SESEmailClient; } });
var MailgunEmailClient_1 = require("./mailgun/MailgunEmailClient");
Object.defineProperty(exports, "MailgunEmailClient", { enumerable: true, get: function () { return MailgunEmailClient_1.MailgunEmailClient; } });
var SendGridEmailClient_1 = require("./sendgrid/SendGridEmailClient");
Object.defineProperty(exports, "SendGridEmailClient", { enumerable: true, get: function () { return SendGridEmailClient_1.SendGridEmailClient; } });
var MailchimpEmailClient_1 = require("./mailchimp/MailchimpEmailClient");
Object.defineProperty(exports, "MailchimpEmailClient", { enumerable: true, get: function () { return MailchimpEmailClient_1.MailchimpEmailClient; } });
var ZohoEmailClient_1 = require("./zoho/ZohoEmailClient");
Object.defineProperty(exports, "ZohoEmailClient", { enumerable: true, get: function () { return ZohoEmailClient_1.ZohoEmailClient; } });
//# sourceMappingURL=index.js.map