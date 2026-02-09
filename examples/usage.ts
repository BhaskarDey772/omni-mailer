/**
 * omni-mailer Usage Examples
 *
 * This file demonstrates how to use the email service module
 * with different providers, attachments, tracking, and webhooks.
 */

import {
  // Provider clients
  SESEmailClient,
  MailgunEmailClient,
  SendGridEmailClient,
  MailchimpEmailClient,
  ZohoEmailClient,

  // Webhook server
  WebhookServer,

  // Utilities
  ConfigValidator,

  // Types
  type EmailData,
  type SendResult,
  type IncomingEmail,
  type DeliveryEvent,
  type BounceEvent,
  type OpenEvent,
  type ClickEvent,
} from '../src';

// ──────────────────────────────────────────────────────────
// 1. INITIALIZE CLIENTS
// ──────────────────────────────────────────────────────────

// Option A: Direct config
const ses = new SESEmailClient({
  provider: 'aws-ses',
  region: 'us-east-1',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
});

const mailgun = new MailgunEmailClient({
  provider: 'mailgun',
  apiKey: 'YOUR_MAILGUN_KEY',
  domain: 'mg.yourdomain.com',
});

const sendgrid = new SendGridEmailClient({
  provider: 'sendgrid',
  apiKey: 'YOUR_SENDGRID_KEY',
});

const mailchimp = new MailchimpEmailClient({
  provider: 'mailchimp',
  apiKey: 'YOUR_MANDRILL_KEY',
});

const zoho = new ZohoEmailClient({
  provider: 'zoho',
  user: 'you@zoho.com',
  password: 'YOUR_APP_PASSWORD',
});

// Option B: From environment variables
// const ses = new SESEmailClient(ConfigValidator.sesFromEnv());
// const mailgun = new MailgunEmailClient(ConfigValidator.mailgunFromEnv());

// ──────────────────────────────────────────────────────────
// 2. SEND A SINGLE EMAIL
// ──────────────────────────────────────────────────────────

async function sendBasicEmail() {
  const result = await ses.send({
    from: 'sender@yourdomain.com',
    to: 'recipient@example.com',
    subject: 'Hello from omni-mailer',
    html: '<h1>Welcome!</h1><p>This is a test email.</p>',
    text: 'Welcome! This is a test email.',
  });

  console.log(result);
  // { success: true, messageId: '...', provider: 'aws-ses' }
}

// ──────────────────────────────────────────────────────────
// 3. SEND WITH CC, BCC, REPLY-TO
// ──────────────────────────────────────────────────────────

async function sendWithOptions() {
  const result = await mailgun.send({
    from: { email: 'sender@yourdomain.com', name: 'Your App' },
    to: ['user1@example.com', 'user2@example.com'],
    cc: 'manager@example.com',
    bcc: ['audit@example.com'],
    replyTo: 'support@yourdomain.com',
    subject: 'Team Update',
    html: '<h1>Team Update</h1><p>Here is the latest update.</p>',
    tags: ['team-update', 'newsletter'],
    metadata: { campaign: 'weekly-update' },
  });

  console.log(result);
}

// ──────────────────────────────────────────────────────────
// 4. SEND WITH ATTACHMENTS
// ──────────────────────────────────────────────────────────

async function sendWithAttachments() {
  const result = await sendgrid.send({
    from: 'billing@yourdomain.com',
    to: 'customer@example.com',
    subject: 'Your Invoice',
    html: '<h1>Invoice Attached</h1><p>Please find your invoice attached.</p>',
    attachments: [
      // From file path
      {
        type: 'file',
        filename: 'invoice.pdf',
        path: '/path/to/invoice.pdf',
      },
      // From buffer
      {
        type: 'buffer',
        filename: 'data.csv',
        content: Buffer.from('name,email\nJohn,john@example.com'),
        contentType: 'text/csv',
      },
      // From URL
      {
        type: 'url',
        filename: 'logo.png',
        url: 'https://example.com/logo.png',
        contentType: 'image/png',
        inline: true,
        contentId: 'logo',
      },
    ],
  });

  console.log(result);
}

// ──────────────────────────────────────────────────────────
// 5. SEND BULK EMAILS
// ──────────────────────────────────────────────────────────

async function sendBulkEmails() {
  const emails: EmailData[] = Array.from({ length: 100 }, (_, i) => ({
    from: 'newsletter@yourdomain.com',
    to: `user${i}@example.com`,
    subject: `Newsletter #${i + 1}`,
    html: `<h1>Hello User ${i + 1}!</h1><p>Your personalized content here.</p>`,
  }));

  const result = await ses.sendBulk(emails, {
    concurrency: 10,
    delayMs: 200,
    retryAttempts: 2,
    onProgress: (progress) => {
      console.log(`Progress: ${progress.sent}/${progress.total} (${progress.failed} failed)`);
    },
  });

  console.log(`Sent: ${result.successful}, Failed: ${result.failed}, Duration: ${result.durationMs}ms`);
}

// ──────────────────────────────────────────────────────────
// 6. SEND TEMPLATED EMAILS
// ──────────────────────────────────────────────────────────

async function sendTemplatedEmail() {
  // SES template
  const sesResult = await ses.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'WelcomeTemplate',
    templateData: { name: 'John', plan: 'Premium' },
  });

  // SendGrid dynamic template
  const sgResult = await sendgrid.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'd-abc123templateid',
    templateData: { name: 'John', plan: 'Premium' },
  });

  // Mailchimp/Mandrill template
  const mcResult = await mailchimp.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'welcome-email',
    templateData: { FNAME: 'John', PLAN: 'Premium' },
  });
}

// ──────────────────────────────────────────────────────────
// 7. ENABLE OPEN/CLICK TRACKING
// ──────────────────────────────────────────────────────────

async function sendWithTracking() {
  // Enable custom tracking (injects pixel + rewrites links)
  ses.enableTracking({
    baseUrl: 'https://yourdomain.com',
    enabled: true,
  });

  const result = await ses.send({
    from: 'marketing@yourdomain.com',
    to: 'user@example.com',
    subject: 'Check out our new product!',
    html: `
      <h1>New Product Launch</h1>
      <p>We're excited to announce our new product.</p>
      <a href="https://yourdomain.com/product">Learn More</a>
    `,
    trackOpens: true,
    trackClicks: true,
  });

  // For providers with native tracking (Mailgun, SendGrid, Mailchimp),
  // just set trackOpens/trackClicks - they handle it server-side
  const mgResult = await mailgun.send({
    from: 'marketing@yourdomain.com',
    to: 'user@example.com',
    subject: 'Check out our new product!',
    html: '<h1>New Product Launch</h1><a href="https://yourdomain.com/product">Learn More</a>',
    trackOpens: true,
    trackClicks: true,
  });
}

// ──────────────────────────────────────────────────────────
// 8. PROVIDER FAILOVER
// ──────────────────────────────────────────────────────────

async function sendWithFailover(emailData: EmailData) {
  // Try primary provider first, fall back to secondary
  let result = await ses.send(emailData);

  if (!result.success) {
    console.log(`SES failed: ${result.error}. Trying Mailgun...`);
    result = await mailgun.send(emailData);
  }

  if (!result.success) {
    console.log(`Mailgun failed: ${result.error}. Trying SendGrid...`);
    result = await sendgrid.send(emailData);
  }

  return result;
}

// ──────────────────────────────────────────────────────────
// 9. WEBHOOK SERVER - RECEIVE EMAILS & TRACK EVENTS
// ──────────────────────────────────────────────────────────

async function startWebhookServer() {
  const server = new WebhookServer({
    port: 3000,

    // Handle incoming emails from any provider
    webhookCallbacks: {
      onIncomingEmail: async (email: IncomingEmail) => {
        console.log(`New email from ${email.from}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Provider: ${email.provider}`);
        console.log(`Body: ${email.text}`);

        // Save to YOUR database (no internal DB used)
        // await db.emails.create({ ... });

        // Check if it's a reply (conversation threading)
        if (email.inReplyTo) {
          console.log(`This is a reply to: ${email.inReplyTo}`);
          // await db.conversations.addReply(email.inReplyTo, email);
        }

        // Handle attachments
        if (email.attachments) {
          for (const att of email.attachments) {
            console.log(`Attachment: ${att.filename} (${att.size} bytes)`);
            // await storage.save(att.content || att.url);
          }
        }
      },

      onError: async (error, provider) => {
        console.error(`Webhook error from ${provider}:`, error.message);
      },
    },

    // Handle tracking events (delivery, opens, clicks, bounces)
    trackingCallbacks: {
      onDelivery: async (event: DeliveryEvent) => {
        console.log(`Email ${event.messageId} delivered to ${event.recipient}`);
        // await db.emails.updateStatus(event.messageId, 'delivered');
      },

      onBounce: async (event: BounceEvent) => {
        console.log(`Email ${event.messageId} bounced (${event.bounceType}): ${event.bounceReason}`);
        // await db.emails.updateStatus(event.messageId, 'bounced');
        // if (event.bounceType === 'hard') {
        //   await db.contacts.markInvalid(event.recipient);
        // }
      },

      onOpen: async (event: OpenEvent) => {
        console.log(`Email ${event.messageId} opened by ${event.recipient}`);
        // await db.analytics.recordOpen(event.messageId);
      },

      onClick: async (event: ClickEvent) => {
        console.log(`Link clicked in ${event.messageId}: ${event.url}`);
        // await db.analytics.recordClick(event.messageId, event.url);
      },

      onComplaint: async (event) => {
        console.log(`Spam complaint for ${event.messageId} from ${event.recipient}`);
        // await db.contacts.unsubscribe(event.recipient);
      },

      onUnsubscribe: async (event) => {
        console.log(`Unsubscribe for ${event.messageId} from ${event.recipient}`);
        // await db.contacts.unsubscribe(event.recipient);
      },

      // Catch-all for any tracking event
      onAny: async (event) => {
        console.log(`[${event.type}] ${event.messageId} - ${event.recipient}`);
      },
    },

    // Security: verify webhook signatures
    verifySignatures: true,
    webhookSecrets: {
      mailgun: process.env.MAILGUN_WEBHOOK_SECRET,
      sendgrid: process.env.SENDGRID_WEBHOOK_SECRET,
    },
  });

  await server.start();
  // Server now listening for:
  // POST /webhooks/ses/incoming     - SES incoming emails (via SNS)
  // POST /webhooks/mailgun/incoming - Mailgun incoming emails
  // POST /webhooks/sendgrid/incoming - SendGrid inbound parse
  // POST /webhooks/mailchimp/incoming - Mailchimp inbound
  // POST /webhooks/custom/incoming  - Custom webhook format
  // POST /webhooks/*/events         - Tracking events per provider
  // GET  /track/open/:messageId     - Open tracking pixel
  // GET  /track/click/:messageId    - Click tracking redirect
  // GET  /health                    - Health check
}

// ──────────────────────────────────────────────────────────
// 10. MOUNT WEBHOOK ON EXISTING EXPRESS APP
// ──────────────────────────────────────────────────────────

async function mountOnExistingApp() {
  const express = require('express');
  const app = express();

  const webhookServer = new WebhookServer({
    webhookCallbacks: {
      onIncomingEmail: async (email) => {
        console.log('Received:', email.subject);
      },
    },
  });

  // Mount the webhook routes on your existing app
  app.use(webhookServer.getApp());

  // Add your own routes
  app.get('/api/status', (_req: any, res: any) => res.json({ ok: true }));

  app.listen(3000);
}

// ──────────────────────────────────────────────────────────
// 11. ZOHO SMTP VERIFICATION
// ──────────────────────────────────────────────────────────

async function verifyZohoConnection() {
  const isConnected = await zoho.verify();
  console.log(`Zoho SMTP connection: ${isConnected ? 'OK' : 'FAILED'}`);

  if (isConnected) {
    await zoho.send({
      from: 'you@zoho.com',
      to: 'recipient@example.com',
      subject: 'Test from Zoho',
      html: '<p>Hello from Zoho!</p>',
    });
  }

  // Clean up connection pool
  zoho.close();
}
