import express from 'express';
import {
  type BounceEvent,
  type ClickEvent,
  type DeliveryEvent,
  type EmailData,
  type IncomingEmail,
  MailchimpEmailClient,
  MailgunEmailClient,
  type OpenEvent,
  SESEmailClient,
  SendGridEmailClient,
  ZohoEmailClient,
} from '../src';
import {
  createMailchimpEventHandler,
  createMailchimpIncomingHandler,
} from '../src/webhooks/mailchimp';
import { createMailgunEventHandler, createMailgunIncomingHandler } from '../src/webhooks/mailgun';
import {
  createSendGridEventHandler,
  createSendGridIncomingHandler,
} from '../src/webhooks/sendgrid';
import { createSESEventHandler, createSESIncomingHandler } from '../src/webhooks/ses';
import { createClickTrackingHandler, createOpenTrackingHandler } from '../src/webhooks/tracking';

// 1. INITIALIZE CLIENTS

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

// From environment variables:
// const ses = new SESEmailClient(ConfigValidator.sesFromEnv());
// const mailgun = new MailgunEmailClient(ConfigValidator.mailgunFromEnv());
// const sendgrid = new SendGridEmailClient(ConfigValidator.sendgridFromEnv());
// const mailchimp = new MailchimpEmailClient(ConfigValidator.mailchimpFromEnv());
// const zoho = new ZohoEmailClient(ConfigValidator.zohoFromEnv());

// 2. SEND A SINGLE EMAIL

async function _sendBasicEmail() {
  const result = await ses.send({
    from: 'sender@yourdomain.com',
    to: 'recipient@example.com',
    subject: 'Hello from omni-mailer',
    html: '<h1>Welcome!</h1><p>This is a test email.</p>',
    text: 'Welcome! This is a test email.',
  });

  console.log(result);
}

// 3. SEND WITH CC, BCC, REPLY-TO

async function _sendWithOptions() {
  const result = await mailgun.send({
    from: { name: 'Your App', address: 'sender@yourdomain.com' },
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

// 4. SEND WITH ATTACHMENTS

async function _sendWithAttachments() {
  const result = await sendgrid.send({
    from: 'billing@yourdomain.com',
    to: 'customer@example.com',
    subject: 'Your Invoice',
    html: '<h1>Invoice Attached</h1><p>Please find your invoice attached.</p>',
    attachments: [
      {
        type: 'file',
        filename: 'invoice.pdf',
        path: '/path/to/invoice.pdf',
      },
      {
        type: 'buffer',
        filename: 'data.csv',
        content: Buffer.from('name,email\nJohn,john@example.com'),
        contentType: 'text/csv',
      },
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

// 5. SEND BULK EMAILS

async function _sendBulkEmails() {
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

  console.log(
    `Sent: ${result.successful}, Failed: ${result.failed}, Duration: ${result.durationMs}ms`,
  );
}

// 6. SEND TEMPLATED EMAILS

async function _sendTemplatedEmail() {
  const _sesResult = await ses.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'WelcomeTemplate',
    templateData: { name: 'John', plan: 'Premium' },
  });

  const _sgResult = await sendgrid.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'd-abc123templateid',
    templateData: { name: 'John', plan: 'Premium' },
  });

  const _mcResult = await mailchimp.sendTemplated({
    from: 'noreply@yourdomain.com',
    to: 'user@example.com',
    template: 'welcome-email',
    templateData: { FNAME: 'John', PLAN: 'Premium' },
  });
}

// 7. ENABLE OPEN/CLICK TRACKING

async function _sendWithTracking() {
  ses.enableTracking({
    baseUrl: 'https://yourdomain.com',
    trackOpens: true,
    trackClicks: true,
  });

  const _result = await ses.send({
    from: 'marketing@yourdomain.com',
    to: 'user@example.com',
    subject: 'Check out our new product!',
    html: `
      <h1>New Product Launch</h1>
      <p>We're excited to announce our new product.</p>
      <a href="https://yourdomain.com/product">Learn More</a>
    `,
  });
}

// 8. PROVIDER FAILOVER

async function _sendWithFailover(emailData: EmailData) {
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

// 9. MODULAR WEBHOOK HANDLERS — MOUNT ON YOUR OWN EXPRESS APP

async function _startServerWithModularHandlers() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // SES webhooks (events delivered via SNS, auto-confirms subscriptions)
  app.post(
    '/webhooks/ses/incoming',
    createSESIncomingHandler({
      onEmail: async (email: IncomingEmail) => {
        console.log(`SES incoming from ${email.from}: ${email.subject}`);
        if (email.inReplyTo) {
          console.log(`Reply to: ${email.inReplyTo}`);
        }
      },
      onError: async (err) => console.error('SES incoming error:', err),
    }),
  );

  app.post(
    '/webhooks/ses/events',
    createSESEventHandler({
      onEvent: async (event) => {
        console.log(`SES event: ${event.type} — ${event.messageId}`);
      },
      onError: async (err) => console.error('SES event error:', err),
    }),
  );

  // Mailgun webhooks (with optional HMAC signature verification)
  app.post(
    '/webhooks/mailgun/incoming',
    createMailgunIncomingHandler({
      onEmail: async (email: IncomingEmail) => {
        console.log(`Mailgun incoming from ${email.from}: ${email.subject}`);
        if (email.attachments) {
          for (const att of email.attachments) {
            console.log(`Attachment: ${att.filename} (${att.size} bytes)`);
          }
        }
      },
      secret: process.env.MAILGUN_WEBHOOK_SECRET,
    }),
  );

  app.post(
    '/webhooks/mailgun/events',
    createMailgunEventHandler({
      onEvent: async (event) => {
        console.log(`Mailgun event: ${event.type} — ${event.recipient}`);
      },
      secret: process.env.MAILGUN_WEBHOOK_SECRET,
    }),
  );

  // SendGrid webhooks (handles batched JSON arrays)
  app.post(
    '/webhooks/sendgrid/incoming',
    createSendGridIncomingHandler({
      onEmail: async (email: IncomingEmail) => {
        console.log(`SendGrid incoming from ${email.from}: ${email.subject}`);
      },
    }),
  );

  app.post(
    '/webhooks/sendgrid/events',
    createSendGridEventHandler({
      onEvent: async (event) => {
        console.log(`SendGrid event: ${event.type} — ${event.recipient}`);
      },
    }),
  );

  // Mailchimp/Mandrill webhooks (handles mandrill_events form param and JSON)
  app.post(
    '/webhooks/mailchimp/incoming',
    createMailchimpIncomingHandler({
      onEmail: async (email: IncomingEmail) => {
        console.log(`Mailchimp incoming from ${email.from}: ${email.subject}`);
      },
    }),
  );

  app.post(
    '/webhooks/mailchimp/events',
    createMailchimpEventHandler({
      onEvent: async (event) => {
        console.log(`Mailchimp event: ${event.type} — ${event.recipient}`);
      },
    }),
  );

  // Open & click tracking (serves 1x1 pixel / 302 redirect)
  app.get(
    '/track/open/:messageId',
    createOpenTrackingHandler({
      onEvent: async (event) => {
        console.log(`Opened: ${event.messageId} from ${event.ipAddress}`);
      },
    }),
  );

  app.get(
    '/track/click/:messageId',
    createClickTrackingHandler({
      onEvent: async (event) => {
        const clickEvent = event as ClickEvent;
        console.log(`Clicked: ${clickEvent.messageId} → ${clickEvent.url}`);
      },
    }),
  );

  // Your own routes alongside the webhook handlers
  app.get('/api/status', (_req, res) => res.json({ ok: true }));

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}

// 10. TRACKING EVENT HANDLING — DETAILED CALLBACKS

async function _startServerWithDetailedTracking() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const handleEvent = async (event: DeliveryEvent | BounceEvent | OpenEvent | ClickEvent) => {
    switch (event.type) {
      case 'delivered':
        console.log(`Delivered: ${event.messageId} to ${event.recipient}`);
        break;
      case 'bounced': {
        const bounce = event as BounceEvent;
        console.log(`Bounced (${bounce.bounceType}): ${bounce.recipient} — ${bounce.bounceReason}`);
        break;
      }
      case 'opened': {
        const open = event as OpenEvent;
        console.log(`Opened: ${open.messageId} by ${open.userAgent} from ${open.ipAddress}`);
        break;
      }
      case 'clicked': {
        const click = event as ClickEvent;
        console.log(`Clicked: ${click.messageId} → ${click.url}`);
        break;
      }
    }
  };

  app.post('/hooks/ses/events', createSESEventHandler({ onEvent: handleEvent }));
  app.post(
    '/hooks/mailgun/events',
    createMailgunEventHandler({
      onEvent: handleEvent,
      secret: process.env.MAILGUN_WEBHOOK_SECRET,
    }),
  );
  app.post('/hooks/sendgrid/events', createSendGridEventHandler({ onEvent: handleEvent }));
  app.post('/hooks/mailchimp/events', createMailchimpEventHandler({ onEvent: handleEvent }));

  app.get('/track/open/:messageId', createOpenTrackingHandler({ onEvent: handleEvent }));
  app.get('/track/click/:messageId', createClickTrackingHandler({ onEvent: handleEvent }));

  app.listen(3000, () => {
    console.log('Tracking server running on http://localhost:3000');
  });
}

// 11. CONVERSATION THREADING

async function _startIncomingEmailServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const handleIncoming = async (email: IncomingEmail) => {
    console.log(`From: ${email.from}`);
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Message-ID: ${email.messageId}`);

    if (email.inReplyTo) {
      console.log(`Reply to: ${email.inReplyTo}`);
      console.log(`Thread: ${email.references?.join(' → ')}`);
      // await db.conversations.addReply(email.inReplyTo, email);
    } else {
      // New conversation
      // await db.conversations.create({ emails: [email.messageId], subject: email.subject });
    }

    if (email.attachments) {
      for (const att of email.attachments) {
        console.log(`Attachment: ${att.filename} (${att.contentType}, ${att.size} bytes)`);
      }
    }
  };

  app.post('/incoming/ses', createSESIncomingHandler({ onEmail: handleIncoming }));
  app.post(
    '/incoming/mailgun',
    createMailgunIncomingHandler({
      onEmail: handleIncoming,
      secret: process.env.MAILGUN_WEBHOOK_SECRET,
    }),
  );
  app.post('/incoming/sendgrid', createSendGridIncomingHandler({ onEmail: handleIncoming }));
  app.post('/incoming/mailchimp', createMailchimpIncomingHandler({ onEmail: handleIncoming }));

  app.listen(3000, () => {
    console.log('Incoming email server running on http://localhost:3000');
  });
}

// 12. ZOHO SMTP VERIFICATION

async function _verifyZohoConnection() {
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

  zoho.close();
}
