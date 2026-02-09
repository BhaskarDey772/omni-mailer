"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookError = exports.ProviderError = exports.ValidationError = exports.EmailError = void 0;
class EmailError extends Error {
    constructor(message, provider, code = 'EMAIL_ERROR') {
        super(message);
        this.name = 'EmailError';
        this.provider = provider;
        this.code = code;
    }
}
exports.EmailError = EmailError;
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
class ProviderError extends EmailError {
    constructor(message, provider, httpStatus, providerCode) {
        super(message, provider, 'PROVIDER_ERROR');
        this.name = 'ProviderError';
        this.httpStatus = httpStatus;
        this.providerCode = providerCode;
    }
}
exports.ProviderError = ProviderError;
class WebhookError extends Error {
    constructor(message, provider) {
        super(message);
        this.name = 'WebhookError';
        this.provider = provider;
    }
}
exports.WebhookError = WebhookError;
//# sourceMappingURL=EmailError.js.map