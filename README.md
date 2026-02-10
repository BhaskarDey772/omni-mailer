# omni-mailer

A universal TypeScript email service supporting **AWS SES**, **Mailgun**, **SendGrid**, **Mailchimp (Mandrill)**, and **Zoho** — with built-in tracking, modular webhooks, attachments, and bulk sending.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Provider Setup](#provider-setup)
  - [AWS SES](#aws-ses)
  - [Mailgun](#mailgun)
  - [SendGrid](#sendgrid)
  - [Mailchimp (Mandrill)](#mailchimp-mandrill)
  - [Zoho](#zoho)
- [Sending Emails](#sending-emails)
  - [Single Email](#single-email)
  - [HTML Email](#html-email)
  - [Templated Email](#templated-email)
  - [Bulk Email](#bulk-email)
- [Attachments](#attachments)
- [Tracking](#tracking)
  - [Enable Open & Click Tracking](#enable-open--click-tracking)
  - [Open & Click Tracking Handlers](#open--click-tracking-handlers)
- [Webhooks](#webhooks)
  - [Modular Handlers](#modular-handlers)
  - [Sub-path Imports](#sub-path-imports)
  - [SES Webhooks](#ses-webhooks)
  - [Mailgun Webhooks](#mailgun-webhooks)
  - [SendGrid Webhooks](#sendgrid-webhooks)
  - [Mailchimp Webhooks](#mailchimp-webhooks)
  - [WebhookServer (Convenience Wrapper)](#webhookserver-convenience-wrapper)
- [Incoming Email & Conversation Threading](#incoming-email--conversation-threading)
- [Complete Examples](#complete-examples)
  - [SES Full Example](#ses-full-example)
  - [Mailgun Full Example](#mailgun-full-example)
- [Error Handling](#error-handling)
- [API Reference](#api-reference)
- [Publishing to npm](#publishing-to-npm)

---

## Installation

```bash
npm install omni-mailer
```

**Requirements:** Node.js >= 18.0.0

---

## Quick Start

```typescript
import { SESEmailClient } from 'omni-mailer';

const mailer = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
});

const result = await mailer.send({
  from: 'you@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Hello from omni-mailer',
  text: 'This is a plain text email.',
  html: '<h1>Hello!</h1><p>This is an HTML email.</p>',
});

console.log(result);
// { success: true, messageId: '...', provider: 'aws-ses' }
```

---

## Provider Setup

### AWS SES

**Prerequisites:**
1. An AWS account with SES enabled
2. Verified sender email or domain in SES
3. IAM credentials with `ses:SendEmail` and `ses:SendRawEmail` permissions
4. If in SES sandbox, recipient emails must also be verified

```typescript
import { SESEmailClient } from 'omni-mailer';

const ses = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
});
```

From environment variables:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```typescript
import { SESEmailClient, ConfigValidator } from 'omni-mailer';
const ses = new SESEmailClient(ConfigValidator.sesFromEnv());
```

---

### Mailgun

```typescript
import { MailgunEmailClient } from 'omni-mailer';

const mailgun = new MailgunEmailClient({
  provider: 'mailgun',
  apiKey: 'key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  domain: 'mg.yourdomain.com',
  // host: 'api.eu.mailgun.net', // for EU region
});
```

From environment variables:

```bash
MAILGUN_API_KEY=key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MAILGUN_DOMAIN=mg.yourdomain.com
```

```typescript
import { MailgunEmailClient, ConfigValidator } from 'omni-mailer';
const mailgun = new MailgunEmailClient(ConfigValidator.mailgunFromEnv());
```

---

### SendGrid

```typescript
import { SendGridEmailClient } from 'omni-mailer';

const sendgrid = new SendGridEmailClient({
  provider: 'sendgrid',
  apiKey: 'SG.XXXXXXXXXXXXXXXXXXXX',
});
```

From environment variables: `SENDGRID_API_KEY`

```typescript
import { SendGridEmailClient, ConfigValidator } from 'omni-mailer';
const sendgrid = new SendGridEmailClient(ConfigValidator.sendgridFromEnv());
```

---

### Mailchimp (Mandrill)

```typescript
import { MailchimpEmailClient } from 'omni-mailer';

const mailchimp = new MailchimpEmailClient({
  provider: 'mailchimp',
  apiKey: 'YOUR_MANDRILL_API_KEY',
});
```

From environment variables: `MAILCHIMP_API_KEY`

```typescript
import { MailchimpEmailClient, ConfigValidator } from 'omni-mailer';
const mailchimp = new MailchimpEmailClient(ConfigValidator.mailchimpFromEnv());
```

---

### Zoho

```typescript
import { ZohoEmailClient } from 'omni-mailer';

const zoho = new ZohoEmailClient({
  provider: 'zoho',
  user: 'you@zoho.com',
  password: 'your-app-password',
  // host: 'smtp.zoho.com',
  // port: 465,
  // secure: true,
});
```

From environment variables: `ZOHO_USER`, `ZOHO_PASSWORD`

```typescript
import { ZohoEmailClient, ConfigValidator } from 'omni-mailer';
const zoho = new ZohoEmailClient(ConfigValidator.zohoFromEnv());
```

> Zoho does not support server-side templates. Render your template to HTML and use `send()`.

---

## Sending Emails

All providers share the same API.

### Single Email

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Hello!',
  text: 'Plain text body',
});
```

### HTML Email

```typescript
const result = await mailer.send({
  from: { name: 'Your App', address: 'noreply@yourdomain.com' },
  to: [
    'user1@example.com',
    { name: 'User Two', address: 'user2@example.com' },
  ],
  cc: 'cc@example.com',
  bcc: 'bcc@example.com',
  replyTo: 'support@yourdomain.com',
  subject: 'Weekly Newsletter',
  html: '<h1>Weekly Update</h1><p>Here\'s what happened this week...</p>',
  text: 'Weekly Update\n\nHere\'s what happened this week...',
  headers: { 'X-Custom-Header': 'custom-value' },
  tags: ['newsletter', 'weekly'],
  metadata: { campaignId: 'week-42', userId: '12345' },
});
```

### Templated Email

```typescript
const result = await mailer.sendTemplated({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  template: 'welcome-template',
  templateData: {
    firstName: 'John',
    activationLink: 'https://yourdomain.com/activate?token=abc',
  },
});
```

Supported by Mailgun, SendGrid, and Mailchimp.

### Bulk Email

```typescript
const emails = [
  {
    from: 'noreply@yourdomain.com',
    to: 'user1@example.com',
    subject: 'Your Report',
    html: '<p>Hi User 1, here is your report.</p>',
  },
  {
    from: 'noreply@yourdomain.com',
    to: 'user2@example.com',
    subject: 'Your Report',
    html: '<p>Hi User 2, here is your report.</p>',
  },
];

const bulkResult = await mailer.sendBulk(emails, {
  concurrency: 5,
  batchSize: 100,
  delayMs: 100,
  retryAttempts: 3,
  onProgress: (progress) => {
    console.log(`${progress.sent}/${progress.total} sent, ${progress.failed} failed`);
  },
});
// { total: 2, successful: 2, failed: 0, results: [...], durationMs: 1234 }
```

---

## Attachments

Attachments work the same across all providers. Three types supported:

```typescript
await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Files',
  text: 'See attached.',
  attachments: [
    // File from disk
    { type: 'file', filename: 'report.pdf', path: './report.pdf' },

    // In-memory buffer
    {
      type: 'buffer',
      filename: 'data.csv',
      content: Buffer.from('Name,Email\nJohn,john@example.com'),
      contentType: 'text/csv',
    },

    // Remote URL (downloaded automatically)
    {
      type: 'url',
      filename: 'contract.pdf',
      url: 'https://yourdomain.com/documents/contract.pdf',
    },

    // Inline image (referenced via cid: in HTML)
    {
      type: 'file',
      filename: 'logo.png',
      path: './logo.png',
      contentId: 'company-logo',
      inline: true,
    },
  ],
});
```

Reference inline images in HTML with `<img src="cid:company-logo" />`.

---

## Tracking

### Enable Open & Click Tracking

Enable tracking on your email client. The `baseUrl` should point to where your tracking endpoints are served.

```typescript
mailer.enableTracking({
  baseUrl: 'https://yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Tracked Email',
  html: '<p>Click <a href="https://yourdomain.com/offer">here</a> for our offer.</p>',
});
// HTML is automatically modified:
// - A 1x1 tracking pixel is injected before </body>
// - Links are rewritten to pass through your click tracking endpoint
```

### Open & Click Tracking Handlers

Mount the tracking handlers on your Express app at any route you want:

```typescript
import express from 'express';
import { createOpenTrackingHandler, createClickTrackingHandler } from 'omni-mailer/webhooks/tracking';

const app = express();

app.get('/track/open/:messageId', createOpenTrackingHandler({
  onEvent: async (event) => {
    // event.type → 'opened'
    // event.messageId, event.userAgent, event.ipAddress, event.timestamp
  },
}));

app.get('/track/click/:messageId', createClickTrackingHandler({
  onEvent: async (event) => {
    // event.type → 'clicked'
    // event.messageId, event.url, event.userAgent, event.ipAddress
    // Automatically redirects (302) to the original URL
  },
}));
```

---

## Webhooks

omni-mailer provides **modular webhook handler factories** — standalone functions that return Express-compatible `(req, res)` handlers. Mount them on your own server at any URL. Import only the providers you need for smaller bundles.

### Modular Handlers

Each handler factory takes an options object with callbacks and returns an Express handler:

```typescript
import express from 'express';
import { createSESEventHandler, createSESIncomingHandler } from 'omni-mailer/webhooks/ses';
import { createMailgunEventHandler, createMailgunIncomingHandler } from 'omni-mailer/webhooks/mailgun';
import { createOpenTrackingHandler, createClickTrackingHandler } from 'omni-mailer/webhooks/tracking';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/my/ses/events', createSESEventHandler({
  onEvent: async (event) => console.log(event.type, event.messageId),
  onError: async (err) => console.error(err),
}));

app.post('/my/ses/incoming', createSESIncomingHandler({
  onEmail: async (email) => console.log(email.from, email.subject),
  onError: async (err) => console.error(err),
}));

app.post('/my/mailgun/events', createMailgunEventHandler({
  onEvent: async (event) => console.log(event.type, event.recipient),
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));

app.post('/my/mailgun/incoming', createMailgunIncomingHandler({
  onEmail: async (email) => console.log(email.from, email.subject),
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));

app.get('/track/open/:messageId', createOpenTrackingHandler({
  onEvent: async (event) => console.log('Opened:', event.messageId),
}));

app.get('/track/click/:messageId', createClickTrackingHandler({
  onEvent: async (event) => console.log('Clicked:', event.url),
}));

app.listen(3000);
```

### Sub-path Imports

Import only what you need — each provider is a separate module:

```typescript
import { createSESIncomingHandler, createSESEventHandler } from 'omni-mailer/webhooks/ses';
import { createMailgunIncomingHandler, createMailgunEventHandler } from 'omni-mailer/webhooks/mailgun';
import { createSendGridIncomingHandler, createSendGridEventHandler } from 'omni-mailer/webhooks/sendgrid';
import { createMailchimpIncomingHandler, createMailchimpEventHandler } from 'omni-mailer/webhooks/mailchimp';
import { createOpenTrackingHandler, createClickTrackingHandler } from 'omni-mailer/webhooks/tracking';
```

Or import all handlers at once:

```typescript
import { createSESEventHandler, createMailgunEventHandler, ... } from 'omni-mailer/webhooks';
```

### SES Webhooks

SES delivers events via SNS. The handlers auto-confirm SNS subscriptions.

**AWS Setup:**
1. Create an SNS topic
2. Add an HTTPS subscription pointing to your endpoint
3. Configure SES to publish events (Delivery, Bounce, Complaint, Open, Click) to the SNS topic
4. For incoming emails: configure SES Receipt Rules → publish to SNS → point subscription to your incoming endpoint

```typescript
import { createSESEventHandler, createSESIncomingHandler } from 'omni-mailer/webhooks/ses';

app.post('/hooks/ses/events', createSESEventHandler({
  onEvent: async (event) => {
    // event.type: 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
    // event.messageId, event.recipient, event.timestamp, event.provider
    // For bounces: event.bounceType ('hard' | 'soft'), event.bounceReason
    // For opens: event.userAgent, event.ipAddress
    // For clicks: event.url, event.userAgent, event.ipAddress
  },
}));

app.post('/hooks/ses/incoming', createSESIncomingHandler({
  onEmail: async (email) => {
    // email.from, email.to, email.subject, email.messageId
    // email.timestamp, email.headers
  },
}));
```

### Mailgun Webhooks

Supports optional HMAC-SHA256 signature verification.

**Mailgun Dashboard Setup:**
1. Go to Sending → Webhooks
2. Add your endpoint URLs for the events you want

```typescript
import { createMailgunEventHandler, createMailgunIncomingHandler } from 'omni-mailer/webhooks/mailgun';

app.post('/hooks/mailgun/events', createMailgunEventHandler({
  onEvent: async (event) => {
    // event.type: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unsubscribed'
  },
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));

app.post('/hooks/mailgun/incoming', createMailgunIncomingHandler({
  onEmail: async (email) => {
    // email.from, email.to, email.subject, email.text, email.html
    // email.inReplyTo, email.references (for threading)
  },
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));
```

### SendGrid Webhooks

SendGrid sends events as a batched JSON array.

**SendGrid Setup:**
1. Settings → Mail Settings → Event Webhook
2. Set endpoint URL, select events

```typescript
import { createSendGridEventHandler, createSendGridIncomingHandler } from 'omni-mailer/webhooks/sendgrid';

app.post('/hooks/sendgrid/events', createSendGridEventHandler({
  onEvent: async (event) => {
    // event.type: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unsubscribed'
  },
}));

app.post('/hooks/sendgrid/incoming', createSendGridIncomingHandler({
  onEmail: async (email) => { /* Inbound Parse webhook */ },
}));
```

### Mailchimp Webhooks

Handles both `mandrill_events` form parameter and direct JSON body.

**Mandrill Setup:**
1. Settings → Webhooks
2. Add endpoint URL, select triggers

```typescript
import { createMailchimpEventHandler, createMailchimpIncomingHandler } from 'omni-mailer/webhooks/mailchimp';

app.post('/hooks/mailchimp/events', createMailchimpEventHandler({
  onEvent: async (event) => {
    // event.type: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unsubscribed'
  },
}));

app.post('/hooks/mailchimp/incoming', createMailchimpIncomingHandler({
  onEmail: async (email) => { /* Mandrill inbound email */ },
}));
```

### WebhookServer (Convenience Wrapper)

If you want a quick all-in-one setup, `WebhookServer` wraps the modular handlers into a standalone Express server. It uses the same handler factories internally.

```typescript
import { WebhookServer } from 'omni-mailer';

const server = new WebhookServer({
  port: 3000,
  basePath: '/webhooks',
  webhookCallbacks: {
    onIncomingEmail: async (email) => {
      console.log('Incoming:', email.from, email.subject);
    },
    onError: async (error, provider) => {
      console.error(`Error from ${provider}:`, error.message);
    },
  },
  trackingCallbacks: {
    onDelivery: async (event) => console.log('Delivered:', event.recipient),
    onBounce: async (event) => console.log('Bounced:', event.recipient, event.bounceType),
    onOpen: async (event) => console.log('Opened:', event.messageId),
    onClick: async (event) => console.log('Clicked:', event.url),
    onComplaint: async (event) => console.log('Complaint:', event.recipient),
    onUnsubscribe: async (event) => console.log('Unsubscribed:', event.recipient),
    onAny: async (event) => console.log('Event:', event.type),
  },
  webhookSecrets: {
    mailgun: process.env.MAILGUN_WEBHOOK_SECRET,
  },
});

await server.start();
```

This registers routes at:
- `POST /webhooks/{ses,mailgun,sendgrid,mailchimp}/incoming`
- `POST /webhooks/{ses,mailgun,sendgrid,mailchimp}/events`
- `GET /track/open/:messageId`
- `GET /track/click/:messageId`
- `GET /health`

---

## Incoming Email & Conversation Threading

All incoming handlers provide `inReplyTo` and `references` fields for building conversation threads.

```typescript
import { createMailgunIncomingHandler } from 'omni-mailer/webhooks/mailgun';

app.post('/hooks/incoming', createMailgunIncomingHandler({
  onEmail: async (email) => {
    // email.from        → 'user@example.com'
    // email.to          → ['you@yourdomain.com']
    // email.subject     → 'Re: Your order'
    // email.text        → plain text body
    // email.html        → HTML body
    // email.messageId   → '<abc@example.com>'
    // email.inReplyTo   → '<parent@example.com>'
    // email.references  → ['<root@example.com>', '<parent@example.com>']
    // email.timestamp   → Date
    // email.attachments → [{ filename, contentType, size, url?, content? }]

    if (email.inReplyTo) {
      // Reply — find parent and add to thread
      const parent = await db.emails.findUnique({
        where: { messageId: email.inReplyTo },
      });
      if (parent) {
        await db.conversations.update({
          where: { id: parent.conversationId },
          data: { emails: { push: email.messageId } },
        });
      }
    } else {
      // New conversation
      await db.conversations.create({
        data: { emails: [email.messageId], subject: email.subject },
      });
    }
  },
}));
```

---

## Complete Examples

### SES Full Example

```typescript
import express from 'express';
import { SESEmailClient } from 'omni-mailer';
import { createSESEventHandler, createSESIncomingHandler } from 'omni-mailer/webhooks/ses';
import { createOpenTrackingHandler, createClickTrackingHandler } from 'omni-mailer/webhooks/tracking';

const app = express();
app.use(express.json());

const ses = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
});

ses.enableTracking({
  baseUrl: 'https://yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

app.post('/hooks/ses/events', createSESEventHandler({
  onEvent: async (event) => {
    switch (event.type) {
      case 'delivered': console.log(`Delivered to ${event.recipient}`); break;
      case 'bounced': console.log(`Bounced: ${event.recipient}`); break;
      case 'opened': console.log(`Opened: ${event.messageId}`); break;
      case 'clicked': console.log(`Clicked: ${event.messageId}`); break;
      case 'complained': console.log(`Complaint: ${event.recipient}`); break;
    }
  },
}));

app.post('/hooks/ses/incoming', createSESIncomingHandler({
  onEmail: async (email) => {
    console.log(`From ${email.from}: ${email.subject}`);
  },
}));

app.get('/track/open/:messageId', createOpenTrackingHandler({
  onEvent: async (event) => console.log(`Open: ${event.messageId}`),
}));

app.get('/track/click/:messageId', createClickTrackingHandler({
  onEvent: async (event) => console.log(`Click: ${event.messageId} → ${event.url}`),
}));

async function sendWelcome(userEmail: string, userName: string) {
  return ses.send({
    from: { name: 'MyApp', address: 'welcome@yourdomain.com' },
    to: userEmail,
    subject: `Welcome, ${userName}!`,
    html: `
      <h1>Welcome to MyApp, ${userName}!</h1>
      <p>We're glad you're here.</p>
      <a href="https://yourdomain.com/get-started">Get Started</a>
      <img src="cid:logo" alt="MyApp" width="120" />
    `,
    attachments: [
      { type: 'file', filename: 'logo.png', path: './assets/logo.png', contentId: 'logo', inline: true },
      { type: 'file', filename: 'welcome-guide.pdf', path: './assets/welcome-guide.pdf' },
    ],
    tags: ['welcome'],
    metadata: { userId: '12345' },
  });
}

async function sendNewsletter(subscribers: { email: string; name: string }[]) {
  const emails = subscribers.map((sub) => ({
    from: { name: 'Newsletter', address: 'newsletter@yourdomain.com' },
    to: sub.email,
    subject: 'This Week at MyApp',
    html: `<h1>Hi ${sub.name}</h1><p>Here's your weekly update...</p>`,
    tags: ['newsletter'],
  }));

  return ses.sendBulk(emails, {
    concurrency: 10,
    batchSize: 50,
    delayMs: 200,
    retryAttempts: 2,
    onProgress: (p) => console.log(`${p.sent}/${p.total}, ${p.failed} failed`),
  });
}

app.listen(3000, async () => {
  console.log('Server running on http://localhost:3000');
  await sendWelcome('newuser@example.com', 'Alice');
});
```

---

### Mailgun Full Example

```typescript
import express from 'express';
import { MailgunEmailClient } from 'omni-mailer';
import { createMailgunEventHandler, createMailgunIncomingHandler } from 'omni-mailer/webhooks/mailgun';
import { createOpenTrackingHandler, createClickTrackingHandler } from 'omni-mailer/webhooks/tracking';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mailgun = new MailgunEmailClient({
  provider: 'mailgun',
  apiKey: 'key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  domain: 'mg.yourdomain.com',
});

mailgun.enableTracking({
  baseUrl: 'https://yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

app.post('/hooks/mailgun/events', createMailgunEventHandler({
  onEvent: async (event) => {
    console.log(`[${event.type}] ${event.recipient} — ${event.messageId}`);
  },
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));

app.post('/hooks/mailgun/incoming', createMailgunIncomingHandler({
  onEmail: async (email) => {
    console.log(`Incoming: ${email.from} — ${email.subject}`);
    if (email.inReplyTo) {
      console.log(`Thread: reply to ${email.inReplyTo}`);
    }
  },
  secret: process.env.MAILGUN_WEBHOOK_SECRET,
}));

app.get('/track/open/:messageId', createOpenTrackingHandler({
  onEvent: async (event) => console.log(`Opened: ${event.messageId}`),
}));

app.get('/track/click/:messageId', createClickTrackingHandler({
  onEvent: async (event) => console.log(`Clicked: ${event.messageId} → ${event.url}`),
}));

async function sendInvoice(customerEmail: string, invoiceId: string) {
  return mailgun.send({
    from: { name: 'Billing', address: 'billing@yourdomain.com' },
    to: customerEmail,
    subject: `Invoice #${invoiceId}`,
    html: `<h2>Invoice #${invoiceId}</h2><p><a href="https://yourdomain.com/pay/${invoiceId}">Pay Now</a></p>`,
    attachments: [{
      type: 'url',
      filename: `invoice-${invoiceId}.pdf`,
      url: `https://yourdomain.com/api/invoices/${invoiceId}/pdf`,
    }],
    tags: ['invoice'],
  });
}

app.listen(3000, async () => {
  console.log('Server running on http://localhost:3000');
  await sendInvoice('customer@example.com', 'INV-2024-001');
});
```

---

## Error Handling

```typescript
import { EmailError, ValidationError, ProviderError } from 'omni-mailer';

try {
  await mailer.send({ /* ... */ });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message, error.field);
  } else if (error instanceof ProviderError) {
    console.error('Provider error:', error.message, error.provider, error.statusCode);
  } else if (error instanceof EmailError) {
    console.error('Email error:', error.message);
  }
}
```

---

## API Reference

### Email Clients

All providers (`SESEmailClient`, `MailgunEmailClient`, `SendGridEmailClient`, `MailchimpEmailClient`, `ZohoEmailClient`) implement:

| Method | Signature |
|--------|-----------|
| `send` | `send(data: EmailData): Promise<SendResult>` |
| `sendTemplated` | `sendTemplated(data: TemplatedEmailData): Promise<SendResult>` |
| `sendBulk` | `sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>` |
| `enableTracking` | `enableTracking(config: TrackingConfig): void` |

### Webhook Handler Factories

Each returns `(req: Request, res: Response) => Promise<void>`:

| Factory | Import Path | Options |
|---------|------------|---------|
| `createSESIncomingHandler` | `omni-mailer/webhooks/ses` | `IncomingHandlerOptions` |
| `createSESEventHandler` | `omni-mailer/webhooks/ses` | `EventHandlerOptions` |
| `createMailgunIncomingHandler` | `omni-mailer/webhooks/mailgun` | `MailgunIncomingHandlerOptions` |
| `createMailgunEventHandler` | `omni-mailer/webhooks/mailgun` | `MailgunEventHandlerOptions` |
| `createSendGridIncomingHandler` | `omni-mailer/webhooks/sendgrid` | `IncomingHandlerOptions` |
| `createSendGridEventHandler` | `omni-mailer/webhooks/sendgrid` | `EventHandlerOptions` |
| `createMailchimpIncomingHandler` | `omni-mailer/webhooks/mailchimp` | `IncomingHandlerOptions` |
| `createMailchimpEventHandler` | `omni-mailer/webhooks/mailchimp` | `EventHandlerOptions` |
| `createOpenTrackingHandler` | `omni-mailer/webhooks/tracking` | `OpenTrackingHandlerOptions` |
| `createClickTrackingHandler` | `omni-mailer/webhooks/tracking` | `ClickTrackingHandlerOptions` |

**Handler Options:**

```typescript
interface IncomingHandlerOptions {
  onEmail: (email: IncomingEmail) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

interface EventHandlerOptions {
  onEvent: (event: TrackingEventData) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

// Mailgun handlers add optional secret for HMAC-SHA256 verification
interface MailgunIncomingHandlerOptions extends IncomingHandlerOptions { secret?: string; }
interface MailgunEventHandlerOptions extends EventHandlerOptions { secret?: string; }

interface OpenTrackingHandlerOptions { onEvent: (event: TrackingEventData) => void | Promise<void>; }
interface ClickTrackingHandlerOptions { onEvent: (event: TrackingEventData) => void | Promise<void>; }
```

**Tracking Event Types:** `'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unsubscribed'`

### WebhookServer

| Method | Description |
|--------|-------------|
| `start()` | Start standalone Express server |
| `stop()` | Stop the server |
| `getApp()` | Get the Express app instance |

### ConfigValidator

| Method | Environment Variables |
|--------|---------------------|
| `sesFromEnv()` | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| `mailgunFromEnv()` | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` |
| `sendgridFromEnv()` | `SENDGRID_API_KEY` |
| `mailchimpFromEnv()` | `MAILCHIMP_API_KEY` |
| `zohoFromEnv()` | `ZOHO_USER`, `ZOHO_PASSWORD` |

---

## Publishing to npm

```bash
npm login
npm run build
npm pack --dry-run
npm publish
```

For scoped packages:

```bash
npm publish --access public
```

---

## License

MIT
