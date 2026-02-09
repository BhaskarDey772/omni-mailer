"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidator = void 0;
class ConfigValidator {
    static fromEnv(provider) {
        switch (provider) {
            case 'aws-ses':
                return ConfigValidator.sesFromEnv();
            case 'mailgun':
                return ConfigValidator.mailgunFromEnv();
            case 'sendgrid':
                return ConfigValidator.sendgridFromEnv();
            case 'mailchimp':
                return ConfigValidator.mailchimpFromEnv();
            case 'zoho':
                return ConfigValidator.zohoFromEnv();
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    static sesFromEnv() {
        return {
            provider: 'aws-ses',
            region: ConfigValidator.requireEnv('AWS_REGION'),
            accessKeyId: ConfigValidator.requireEnv('AWS_ACCESS_KEY_ID'),
            secretAccessKey: ConfigValidator.requireEnv('AWS_SECRET_ACCESS_KEY'),
            sessionToken: process.env.AWS_SESSION_TOKEN,
        };
    }
    static mailgunFromEnv() {
        return {
            provider: 'mailgun',
            apiKey: ConfigValidator.requireEnv('MAILGUN_API_KEY'),
            domain: ConfigValidator.requireEnv('MAILGUN_DOMAIN'),
            host: process.env.MAILGUN_HOST,
        };
    }
    static sendgridFromEnv() {
        return {
            provider: 'sendgrid',
            apiKey: ConfigValidator.requireEnv('SENDGRID_API_KEY'),
        };
    }
    static mailchimpFromEnv() {
        return {
            provider: 'mailchimp',
            apiKey: ConfigValidator.requireEnv('MAILCHIMP_API_KEY'),
        };
    }
    static zohoFromEnv() {
        return {
            provider: 'zoho',
            user: ConfigValidator.requireEnv('ZOHO_USER'),
            password: ConfigValidator.requireEnv('ZOHO_PASSWORD'),
            host: process.env.ZOHO_HOST,
            port: process.env.ZOHO_PORT ? parseInt(process.env.ZOHO_PORT, 10) : undefined,
        };
    }
    static requireEnv(name) {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
        return value;
    }
}
exports.ConfigValidator = ConfigValidator;
//# sourceMappingURL=ConfigValidator.js.map