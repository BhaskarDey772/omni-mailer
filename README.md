# omni-mailer

A universal TypeScript email service supporting **AWS SES**, **Mailgun**, **SendGrid**, **Mailchimp (Mandrill)**, and **Zoho** — with built-in tracking, webhooks, attachments, and bulk sending.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Provider Setup](#provider-setup)
  - [AWS SES](#aws-ses)
  - [Mailgun](#mailgun)
- [Sending Emails](#sending-emails)
  - [Single Email](#single-email)
  - [HTML Email](#html-email)
  - [Templated Email](#templated-email)
  - [Bulk Email](#bulk-email)
- [Attachments](#attachments)
  - [File Attachment](#file-attachment)
  - [Buffer Attachment](#buffer-attachment)
  - [URL Attachment](#url-attachment)
  - [Inline Images](#inline-images)
- [Tracking](#tracking)
  - [Enable Open & Click Tracking](#enable-open--click-tracking)
  - [Webhook Server Setup](#webhook-server-setup)
  - [Track Deliveries](#track-deliveries)
  - [Track Opens](#track-opens)
  - [Track Clicks](#track-clicks)
  - [Track Bounces & Complaints](#track-bounces--complaints)
- [Conversation Threading](#conversation-threading)
  - [Incoming Email Handling](#incoming-email-handling)
  - [Reply Threading](#reply-threading)
- [Complete Working Examples](#complete-working-examples)
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
import { SESEmailClient, MailgunEmailClient } from 'omni-mailer';

// Pick your provider
const mailer = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
});

// Send an email
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

#### Direct Configuration

```typescript
import { SESEmailClient } from 'omni-mailer';

const ses = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  // sessionToken: '...',  // optional, for temporary credentials
});
```

#### From Environment Variables

```bash
# .env
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

**Prerequisites:**
1. A Mailgun account
2. A verified domain in Mailgun
3. Your API key from Mailgun dashboard

#### Direct Configuration

```typescript
import { MailgunEmailClient } from 'omni-mailer';

const mailgun = new MailgunEmailClient({
  provider: 'mailgun',
  apiKey: 'key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  domain: 'mg.yourdomain.com',
  // host: 'api.eu.mailgun.net',  // for EU region
});
```

#### From Environment Variables

```bash
# .env
MAILGUN_API_KEY=key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MAILGUN_DOMAIN=mg.yourdomain.com
# MAILGUN_HOST=api.eu.mailgun.net  # optional, for EU
```

```typescript
import { MailgunEmailClient, ConfigValidator } from 'omni-mailer';

const mailgun = new MailgunEmailClient(ConfigValidator.mailgunFromEnv());
```

---

## Sending Emails

All providers share the same API for sending emails.

### Single Email

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Hello!',
  text: 'Plain text body',
});

console.log(result.success);    // true
console.log(result.messageId);  // unique message ID
console.log(result.provider);   // 'aws-ses' or 'mailgun'
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
  html: `
    <html>
      <body>
        <h1>Weekly Update</h1>
        <p>Here's what happened this week...</p>
        <a href="https://yourdomain.com/read-more">Read More</a>
      </body>
    </html>
  `,
  text: 'Weekly Update\n\nHere\'s what happened this week...',
  headers: {
    'X-Custom-Header': 'custom-value',
  },
  tags: ['newsletter', 'weekly'],
  metadata: {
    campaignId: 'week-42',
    userId: '12345',
  },
});
```

### Templated Email

```typescript
// Using provider-side templates (Mailgun, SendGrid, Mailchimp)
const result = await mailer.sendTemplated({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  templateId: 'welcome-template',
  templateData: {
    firstName: 'John',
    activationLink: 'https://yourdomain.com/activate?token=abc',
  },
});
```

### Bulk Email

Send hundreds or thousands of emails with concurrency control, batching, and retry logic.

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
  // ... hundreds more
];

const bulkResult = await mailer.sendBulk(emails, {
  concurrency: 5,       // max parallel sends
  batchSize: 100,       // emails per batch
  delayMs: 100,         // delay between batches (ms)
  retryAttempts: 3,     // retry failed sends
  onProgress: (progress) => {
    console.log(`${progress.sent}/${progress.total} sent, ${progress.failed} failed`);
  },
});

console.log(bulkResult);
// {
//   total: 200,
//   successful: 198,
//   failed: 2,
//   results: [ { success: true, messageId: '...' }, ... ],
//   errors: [ { email: {...}, error: Error }, ... ]
// }
```

---

## Attachments

Attachments work the same across all providers.

### File Attachment

Attach a file from the filesystem:

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Invoice Attached',
  text: 'Please find your invoice attached.',
  attachments: [
    {
      type: 'file',
      filename: 'invoice-2024.pdf',
      path: '/path/to/invoice-2024.pdf',
      // contentType auto-detected from extension
    },
  ],
});
```

### Buffer Attachment

Attach in-memory data (e.g., dynamically generated content):

```typescript
const csvContent = 'Name,Email\nJohn,john@example.com\nJane,jane@example.com';

const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Export Data',
  text: 'Your data export is attached.',
  attachments: [
    {
      type: 'buffer',
      filename: 'users-export.csv',
      content: Buffer.from(csvContent, 'utf-8'),
      contentType: 'text/csv',
    },
  ],
});
```

### URL Attachment

Attach a file from a remote URL (downloaded automatically):

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Contract for Review',
  text: 'Please review the attached contract.',
  attachments: [
    {
      type: 'url',
      filename: 'contract.pdf',
      url: 'https://yourdomain.com/documents/contract.pdf',
    },
  ],
});
```

### Inline Images

Embed images directly in your HTML using `cid:` references:

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Check out our logo',
  html: `
    <html>
      <body>
        <h1>Welcome!</h1>
        <img src="cid:company-logo" alt="Logo" width="200" />
        <p>Thanks for joining us.</p>
      </body>
    </html>
  `,
  attachments: [
    {
      type: 'file',
      filename: 'logo.png',
      path: '/path/to/logo.png',
      contentId: 'company-logo',
      inline: true,
    },
  ],
});
```

### Multiple Attachments

```typescript
const result = await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Project Files',
  text: 'All project files attached.',
  attachments: [
    { type: 'file', filename: 'report.pdf', path: './report.pdf' },
    { type: 'file', filename: 'data.xlsx', path: './data.xlsx' },
    {
      type: 'buffer',
      filename: 'summary.txt',
      content: Buffer.from('Project completed successfully.'),
    },
    {
      type: 'url',
      filename: 'reference.pdf',
      url: 'https://example.com/docs/reference.pdf',
    },
  ],
});
```

---

## Tracking

### Enable Open & Click Tracking

Before sending, enable tracking on your client. The `baseUrl` must be a publicly accessible URL where your webhook server runs.

```typescript
const mailer = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'YOUR_KEY',
  secretAccessKey: 'YOUR_SECRET',
});

// Enable tracking — this injects a 1x1 pixel for opens
// and rewrites links for click tracking
mailer.enableTracking({
  baseUrl: 'https://tracking.yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

// Now send — tracking pixels and links are injected automatically
await mailer.send({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Tracked Email',
  html: `
    <html>
      <body>
        <p>Click <a href="https://yourdomain.com/offer">here</a> for our offer.</p>
      </body>
    </html>
  `,
});
// The HTML is automatically modified:
// - A 1x1 tracking pixel is injected before </body>
// - The <a> link is rewritten to pass through /track/click/:messageId
```

### Webhook Server Setup

The `WebhookServer` receives tracking events from your email providers and serves the open pixel/click redirect endpoints.

```typescript
import { WebhookServer } from 'omni-mailer';

const webhookServer = new WebhookServer({
  port: 3000,
  basePath: '/webhooks',
  trackingConfig: {
    baseUrl: 'https://tracking.yourdomain.com',
  },
  trackingCallbacks: {
    onDelivery: async (event) => {
      console.log(`Delivered to ${event.recipient}`, event.messageId);
      // Save to your database
    },
    onBounce: async (event) => {
      console.log(`Bounced: ${event.recipient}`, event.bounceType, event.bounceReason);
      // Remove from mailing list if hard bounce
      if (event.bounceType === 'hard') {
        // await removeFromMailingList(event.recipient);
      }
    },
    onOpen: async (event) => {
      console.log(`Opened by ${event.recipient}`, event.userAgent);
      // Track engagement
    },
    onClick: async (event) => {
      console.log(`Clicked by ${event.recipient}`, event.url);
      // Track link engagement
    },
    onComplaint: async (event) => {
      console.log(`Complaint from ${event.recipient}`);
      // Immediately unsubscribe
    },
    onUnsubscribe: async (event) => {
      console.log(`Unsubscribed: ${event.recipient}`);
    },
    onAny: async (event) => {
      // Catch-all for any tracking event
      console.log(`Event: ${event.type}`, event);
    },
  },
});

await webhookServer.start();
console.log('Webhook server running on port 3000');
```

### Track Deliveries

**How it works:** Your email provider sends a webhook when the recipient's mail server accepts the email.

**SES:** Configure SNS topic → POST to `https://yourdomain.com/webhooks/ses/events`
**Mailgun:** Dashboard → Webhooks → Delivered → `https://yourdomain.com/webhooks/mailgun/events`

```typescript
trackingCallbacks: {
  onDelivery: async (event) => {
    // event.type        → 'delivered'
    // event.messageId   → 'abc123'
    // event.recipient   → 'user@example.com'
    // event.provider    → 'aws-ses' | 'mailgun'
    // event.timestamp   → Date
    // event.smtpResponse → '250 OK' (delivery-specific)

    await db.emailLogs.update({
      where: { messageId: event.messageId },
      data: { status: 'delivered', deliveredAt: event.timestamp },
    });
  },
},
```

### Track Opens

**How it works:** A 1x1 transparent pixel image is injected into the HTML. When the recipient's email client loads images, it hits `/track/open/:messageId`, which triggers the `onOpen` callback and serves the pixel.

```typescript
trackingCallbacks: {
  onOpen: async (event) => {
    // event.type      → 'opened'
    // event.messageId → 'abc123'
    // event.recipient → 'user@example.com'
    // event.userAgent → 'Mozilla/5.0...' (email client info)
    // event.ipAddress → '203.0.113.42'
    // event.timestamp → Date

    await db.emailLogs.update({
      where: { messageId: event.messageId },
      data: {
        opened: true,
        openedAt: event.timestamp,
        openCount: { increment: 1 },
      },
    });
  },
},
```

### Track Clicks

**How it works:** Links in the HTML are rewritten to pass through `/track/click/:messageId?url=<original>`. When clicked, the server records the event and redirects (302) to the original URL.

```typescript
trackingCallbacks: {
  onClick: async (event) => {
    // event.type      → 'clicked'
    // event.messageId → 'abc123'
    // event.recipient → 'user@example.com'
    // event.url       → 'https://yourdomain.com/offer' (original URL)
    // event.userAgent → 'Mozilla/5.0...'
    // event.ipAddress → '203.0.113.42'
    // event.timestamp → Date

    await db.clickEvents.create({
      data: {
        messageId: event.messageId,
        url: event.url,
        clickedAt: event.timestamp,
      },
    });
  },
},
```

### Track Bounces & Complaints

```typescript
trackingCallbacks: {
  onBounce: async (event) => {
    // event.bounceType     → 'hard' | 'soft'
    // event.bounceReason   → 'User unknown'
    // event.diagnosticCode → 'smtp; 550 5.1.1'

    if (event.bounceType === 'hard') {
      await db.subscribers.update({
        where: { email: event.recipient },
        data: { status: 'bounced', active: false },
      });
    }
  },
  onComplaint: async (event) => {
    // User marked your email as spam
    await db.subscribers.update({
      where: { email: event.recipient },
      data: { status: 'complained', active: false },
    });
  },
},
```

---

## Conversation Threading

### Incoming Email Handling

Set up webhook endpoints to receive incoming emails and track conversations.

```typescript
import { WebhookServer } from 'omni-mailer';

const server = new WebhookServer({
  port: 3000,
  webhookCallbacks: {
    onIncomingEmail: async (email) => {
      console.log('New email received:');
      console.log('  From:', email.from);
      console.log('  To:', email.to);
      console.log('  Subject:', email.subject);
      console.log('  Text:', email.text);
      console.log('  HTML:', email.html);
      console.log('  Message-ID:', email.messageId);
      console.log('  In-Reply-To:', email.inReplyTo);      // parent message
      console.log('  References:', email.references);       // full thread chain
      console.log('  Attachments:', email.attachments?.length);

      // Save to database
      await db.emails.create({
        data: {
          messageId: email.messageId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.text,
          html: email.html,
          threadId: email.inReplyTo || email.messageId,  // group by thread
          references: email.references,
        },
      });
    },
    onError: async (error, provider) => {
      console.error(`Webhook error from ${provider}:`, error.message);
    },
  },
});

await server.start();
```

**Webhook endpoints for incoming emails:**

| Provider | Endpoint |
|----------|----------|
| AWS SES | `POST /webhooks/ses/incoming` |
| Mailgun | `POST /webhooks/mailgun/incoming` |
| SendGrid | `POST /webhooks/sendgrid/incoming` |
| Mailchimp | `POST /webhooks/mailchimp/incoming` |
| Custom | `POST /webhooks/custom/incoming` |

### Reply Threading

Build conversation threads using `inReplyTo` and `references` from incoming emails:

```typescript
// When receiving a reply
onIncomingEmail: async (email) => {
  if (email.inReplyTo) {
    // This is a reply — find the parent conversation
    const parentEmail = await db.emails.findUnique({
      where: { messageId: email.inReplyTo },
    });

    if (parentEmail) {
      // Add to existing conversation thread
      await db.conversations.update({
        where: { id: parentEmail.conversationId },
        data: {
          emails: { push: email.messageId },
          lastReplyAt: email.timestamp,
        },
      });
    }
  } else {
    // New conversation
    await db.conversations.create({
      data: {
        emails: [email.messageId],
        subject: email.subject,
        startedAt: email.timestamp,
      },
    });
  }
},
```

---

## Complete Working Examples

### SES Full Example

A complete, runnable example using AWS SES with tracking, attachments, and bulk sending.

```typescript
import {
  SESEmailClient,
  WebhookServer,
  type DeliveryEvent,
  type BounceEvent,
  type OpenEvent,
  type ClickEvent,
} from 'omni-mailer';

// ─── 1. Initialize SES Client ───────────────────────────

const ses = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
});

// ─── 2. Enable Tracking ─────────────────────────────────

ses.enableTracking({
  baseUrl: 'https://mail-track.yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

// ─── 3. Send a Single Email ─────────────────────────────

async function sendWelcomeEmail(userEmail: string, userName: string) {
  const result = await ses.send({
    from: { name: 'MyApp', address: 'welcome@yourdomain.com' },
    to: userEmail,
    subject: `Welcome, ${userName}!`,
    html: `
      <html>
        <body>
          <h1>Welcome to MyApp, ${userName}!</h1>
          <p>We're glad you're here.</p>
          <a href="https://yourdomain.com/get-started">Get Started</a>
          <br/><br/>
          <img src="cid:logo" alt="MyApp" width="120" />
        </body>
      </html>
    `,
    text: `Welcome to MyApp, ${userName}! Get started at https://yourdomain.com/get-started`,
    attachments: [
      {
        type: 'file',
        filename: 'logo.png',
        path: './assets/logo.png',
        contentId: 'logo',
        inline: true,
      },
      {
        type: 'file',
        filename: 'welcome-guide.pdf',
        path: './assets/welcome-guide.pdf',
      },
    ],
    tags: ['welcome', 'onboarding'],
    metadata: { userId: '12345', campaign: 'welcome-flow' },
  });

  console.log('Email sent:', result.messageId);
  return result;
}

// ─── 4. Send Bulk Emails ────────────────────────────────

async function sendWeeklyNewsletter(subscribers: { email: string; name: string }[]) {
  const emails = subscribers.map((sub) => ({
    from: { name: 'MyApp Newsletter', address: 'newsletter@yourdomain.com' },
    to: sub.email,
    subject: 'This Week at MyApp',
    html: `
      <html>
        <body>
          <h1>Hi ${sub.name}, here's your weekly update</h1>
          <p>Check out what's new...</p>
          <a href="https://yourdomain.com/blog">Read our blog</a>
        </body>
      </html>
    `,
    text: `Hi ${sub.name}, check out what's new at https://yourdomain.com/blog`,
    tags: ['newsletter'],
  }));

  const result = await ses.sendBulk(emails, {
    concurrency: 10,
    batchSize: 50,
    delayMs: 200,
    retryAttempts: 2,
    onProgress: (p) => {
      const pct = Math.round((p.sent / p.total) * 100);
      console.log(`Newsletter: ${pct}% (${p.sent}/${p.total}), ${p.failed} failed`);
    },
  });

  console.log(`Newsletter sent: ${result.successful}/${result.total} delivered`);
  if (result.errors.length > 0) {
    console.error('Failed emails:', result.errors.map((e) => e.error.message));
  }
}

// ─── 5. Start Webhook Server for Tracking ───────────────

async function startTrackingServer() {
  const server = new WebhookServer({
    port: 3000,
    trackingConfig: {
      baseUrl: 'https://mail-track.yourdomain.com',
    },
    trackingCallbacks: {
      onDelivery: async (event: DeliveryEvent) => {
        console.log(`[DELIVERED] ${event.recipient} — ${event.messageId}`);
      },
      onBounce: async (event: BounceEvent) => {
        console.log(`[BOUNCED] ${event.recipient} — ${event.bounceType}: ${event.bounceReason}`);
      },
      onOpen: async (event: OpenEvent) => {
        console.log(`[OPENED] ${event.recipient} — ${event.messageId}`);
      },
      onClick: async (event: ClickEvent) => {
        console.log(`[CLICKED] ${event.recipient} — ${event.url}`);
      },
      onComplaint: async (event) => {
        console.log(`[COMPLAINT] ${event.recipient}`);
      },
    },
    webhookCallbacks: {
      onIncomingEmail: async (email) => {
        console.log(`[INCOMING] From: ${email.from}, Subject: ${email.subject}`);
        if (email.inReplyTo) {
          console.log(`  → Reply to: ${email.inReplyTo}`);
        }
      },
      onError: async (err, provider) => {
        console.error(`[ERROR] ${provider}: ${err.message}`);
      },
    },
  });

  await server.start();
  console.log('Tracking & webhook server running on http://localhost:3000');
  console.log('Endpoints:');
  console.log('  POST /webhooks/ses/events    — SES tracking events (via SNS)');
  console.log('  POST /webhooks/ses/incoming   — SES incoming emails');
  console.log('  GET  /track/open/:id          — Open pixel');
  console.log('  GET  /track/click/:id         — Click redirect');
  console.log('  GET  /health                  — Health check');
}

// ─── 6. Run Everything ──────────────────────────────────

async function main() {
  await startTrackingServer();

  await sendWelcomeEmail('newuser@example.com', 'Alice');

  await sendWeeklyNewsletter([
    { email: 'user1@example.com', name: 'Bob' },
    { email: 'user2@example.com', name: 'Carol' },
    { email: 'user3@example.com', name: 'Dave' },
  ]);
}

main().catch(console.error);
```

---

### Mailgun Full Example

```typescript
import {
  MailgunEmailClient,
  WebhookServer,
  type ClickEvent,
  type OpenEvent,
} from 'omni-mailer';

// ─── 1. Initialize Mailgun Client ───────────────────────

const mailgun = new MailgunEmailClient({
  provider: 'mailgun',
  apiKey: 'key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  domain: 'mg.yourdomain.com',
  // host: 'api.eu.mailgun.net',  // uncomment for EU region
});

// ─── 2. Enable Tracking ─────────────────────────────────

mailgun.enableTracking({
  baseUrl: 'https://mail-track.yourdomain.com',
  trackOpens: true,
  trackClicks: true,
});

// ─── 3. Send a Single Email ─────────────────────────────

async function sendInvoiceEmail(customerEmail: string, invoiceId: string) {
  const result = await mailgun.send({
    from: { name: 'Billing', address: 'billing@yourdomain.com' },
    to: customerEmail,
    subject: `Invoice #${invoiceId}`,
    html: `
      <html>
        <body>
          <h2>Invoice #${invoiceId}</h2>
          <p>Your invoice is attached. Pay online:</p>
          <a href="https://yourdomain.com/pay/${invoiceId}">Pay Now</a>
        </body>
      </html>
    `,
    text: `Invoice #${invoiceId}\nPay at: https://yourdomain.com/pay/${invoiceId}`,
    attachments: [
      {
        type: 'url',
        filename: `invoice-${invoiceId}.pdf`,
        url: `https://yourdomain.com/api/invoices/${invoiceId}/pdf`,
      },
    ],
    tags: ['invoice', 'billing'],
    metadata: { invoiceId, customerId: 'cust_123' },
  });

  console.log('Invoice sent:', result.messageId);
}

// ─── 4. Send Bulk Promotional Emails ────────────────────

async function sendPromotion(users: { email: string; name: string; plan: string }[]) {
  const emails = users.map((user) => ({
    from: { name: 'MyApp', address: 'promo@yourdomain.com' },
    to: user.email,
    subject: `Special offer for ${user.plan} users!`,
    html: `
      <html>
        <body>
          <h1>Hey ${user.name}!</h1>
          <p>As a valued ${user.plan} member, you get 20% off upgrades.</p>
          <a href="https://yourdomain.com/upgrade?code=SAVE20">Claim Offer</a>
        </body>
      </html>
    `,
    tags: ['promotion', user.plan],
    metadata: { campaign: 'upgrade-promo', plan: user.plan },
  }));

  const result = await mailgun.sendBulk(emails, {
    concurrency: 5,
    batchSize: 100,
    retryAttempts: 2,
    onProgress: (p) => console.log(`Promo: ${p.sent}/${p.total}`),
  });

  console.log(`Promo campaign: ${result.successful} sent, ${result.failed} failed`);
}

// ─── 5. Tracking & Conversation Server ──────────────────

async function startServer() {
  const server = new WebhookServer({
    port: 3000,
    trackingConfig: { baseUrl: 'https://mail-track.yourdomain.com' },
    trackingCallbacks: {
      onDelivery: async (event) => {
        console.log(`[DELIVERED] ${event.recipient}`);
      },
      onOpen: async (event: OpenEvent) => {
        console.log(`[OPENED] ${event.recipient} via ${event.userAgent}`);
      },
      onClick: async (event: ClickEvent) => {
        console.log(`[CLICKED] ${event.recipient} → ${event.url}`);
      },
      onBounce: async (event) => {
        console.log(`[BOUNCED] ${event.recipient}: ${event.bounceType}`);
      },
    },
    webhookCallbacks: {
      onIncomingEmail: async (email) => {
        console.log(`[INCOMING] ${email.from}: ${email.subject}`);

        // Conversation threading
        if (email.inReplyTo) {
          console.log(`  Thread: reply to ${email.inReplyTo}`);
          console.log(`  Full thread: ${email.references?.join(' → ')}`);
        }

        // Handle attachments
        if (email.attachments && email.attachments.length > 0) {
          for (const att of email.attachments) {
            console.log(`  Attachment: ${att.filename} (${att.contentType})`);
          }
        }
      },
      onError: async (err) => console.error('[ERROR]', err),
    },
  });

  await server.start();
  console.log('Server running on http://localhost:3000');
}

// ─── 6. Run ─────────────────────────────────────────────

async function main() {
  await startServer();
  await sendInvoiceEmail('customer@example.com', 'INV-2024-001');
  await sendPromotion([
    { email: 'alice@example.com', name: 'Alice', plan: 'pro' },
    { email: 'bob@example.com', name: 'Bob', plan: 'starter' },
  ]);
}

main().catch(console.error);
```

---

## Error Handling

```typescript
import {
  SESEmailClient,
  EmailError,
  ValidationError,
  ProviderError,
} from 'omni-mailer';

const ses = new SESEmailClient({ /* config */ });

try {
  await ses.send({
    from: 'sender@yourdomain.com',
    to: 'recipient@example.com',
    subject: 'Test',
    text: 'Hello',
  });
} catch (error) {
  if (error instanceof ValidationError) {
    // Invalid input (missing fields, bad email format)
    console.error('Validation failed:', error.message);
    console.error('Field:', error.field);

  } else if (error instanceof ProviderError) {
    // Provider-specific error (rate limit, auth failure, etc.)
    console.error('Provider error:', error.message);
    console.error('Provider:', error.provider);
    console.error('Status:', error.statusCode);
    console.error('Code:', error.providerCode);

  } else if (error instanceof EmailError) {
    // General email error
    console.error('Email error:', error.message);
  }
}
```

---

## API Reference

### Email Clients

All providers implement the same interface:

| Method | Signature | Description |
|--------|-----------|-------------|
| `send` | `send(data: EmailData): Promise<SendResult>` | Send a single email |
| `sendTemplated` | `sendTemplated(data: TemplatedEmailData): Promise<SendResult>` | Send using a provider template |
| `sendBulk` | `sendBulk(emails: EmailData[], options?: BulkSendOptions): Promise<BulkSendResult>` | Send emails in bulk |
| `enableTracking` | `enableTracking(config: TrackingConfig): void` | Enable open/click tracking |

### Webhook Server

| Method | Description |
|--------|-------------|
| `start()` | Start standalone Express server |
| `stop()` | Stop the server |
| `getApp()` | Get Express app instance (for mounting on existing server) |

### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhooks/{provider}/incoming` | POST | Receive incoming emails |
| `/webhooks/{provider}/events` | POST | Receive tracking events |
| `/track/open/:messageId` | GET | Open tracking pixel |
| `/track/click/:messageId` | GET | Click tracking redirect |
| `/health` | GET | Health check |

**Supported providers:** `ses`, `mailgun`, `sendgrid`, `mailchimp`, `custom`

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
# 1. Login to npm
npm login

# 2. Build the package
npm run build

# 3. Verify what will be published
npm pack --dry-run

# 4. Publish
npm publish
```

To publish under a scope (e.g., `@yourorg/omni-mailer`), update the `name` field in `package.json` and run:

```bash
npm publish --access public
```

---

## License

MIT
