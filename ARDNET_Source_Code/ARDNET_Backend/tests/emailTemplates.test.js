const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const templates = require('../src/services/emailTemplates');

const event = {
  eventType: 'regional-price-alert', eventVersion: 2, eventId: 'a'.repeat(64), alertId: 1, userId: 11,
  regionCode: 'IX', produceName: 'Rice', unit: 'kg', targetPrice: 50, condition: 'lte',
  qualifyingMarkets: [
    { marketName: 'Pagadian Public Market', location: 'Pagadian City', province: 'Zamboanga del Sur', price: 48, unit: 'kg', priceDate: '2026-11-17' },
    { marketName: 'Dipolog Market', location: 'Dipolog City', province: 'Zamboanga del Norte', price: 49, unit: 'kg', priceDate: '2026-11-16' },
  ],
};
const resetUrl = 'https://ardnet.example/reset-password?token=example-token&source=email';
const verificationUrl = 'https://ardnet.example/verify-email?token=example-verification';
const messages = () => [templates.buildWelcomeEmail('Alex'), templates.buildEmailVerificationEmail('Alex', verificationUrl), templates.buildPasswordResetEmail('Alex', resetUrl), templates.buildPriceAlertEmail('Alex', event), templates.buildTestEmail()];

test('all outgoing email types share responsive HTML and readable plain-text content', () => {
  for (const message of messages()) {
    assert.ok(message.subject && message.textContent && message.htmlContent);
    assert.match(message.htmlContent, /<html lang="en"/);
    assert.match(message.htmlContent, /name="viewport"/);
    assert.match(message.htmlContent, /role="presentation"/);
    assert.match(message.htmlContent, /max-width:600px/);
    assert.match(message.htmlContent, /@media only screen and \(max-width:620px\)/);
    assert.match(message.htmlContent, /prefers-color-scheme:dark/);
    assert.doesNotMatch(message.htmlContent, /<script|<iframe|<link[^>]+stylesheet|@import/i);
    assert.match(message.htmlContent, /<img class="email-logo" src="https?:\/\/[^"\s]+" width="52" height="53" alt="ArdNet logo"/);
    assert.doesNotMatch(message.textContent, /<table|<p[ >]|&amp;/);
    assert.match(message.htmlContent, /The ArdNet team/);
  }
});

test('recovery and verification links and expiry information survive templating', () => {
  const reset = templates.buildPasswordResetEmail('Alex', resetUrl);
  assert.match(reset.htmlContent, /20 minutes/); assert.match(reset.textContent, /20 minutes and works once/);
  assert.match(reset.htmlContent, /token=example-token&amp;source=email/); assert.ok(reset.textContent.includes(resetUrl));
  const verification = templates.buildEmailVerificationEmail('Alex', verificationUrl);
  assert.match(verification.htmlContent, /24 hours/); assert.ok(verification.textContent.includes(verificationUrl));
  assert.match(reset.htmlContent, /Your password stays the same/);
});

test('names and price-alert data are escaped as text rather than executable markup', () => {
  const name = '<img src=x onerror="alert(1)"> & Alex';
  for (const message of [templates.buildWelcomeEmail(name), templates.buildPasswordResetEmail(name, resetUrl), templates.buildEmailVerificationEmail(name, verificationUrl)]) {
    assert.ok(!message.htmlContent.includes(name)); assert.match(message.htmlContent, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Alex/); assert.ok(message.textContent.includes(name));
  }
  const alert = templates.buildPriceAlertEmail(name, { ...event, produceName: '<b>Rice</b>', qualifyingMarkets: [{ ...event.qualifyingMarkets[0], marketName: 'Market <script>alert(1)</script>', location: 'City & Province' }] });
  assert.doesNotMatch(alert.htmlContent, /<script|<b>Rice<\/b>/); assert.match(alert.htmlContent, /&lt;b&gt;Rice&lt;\/b&gt;/); assert.match(alert.htmlContent, /City &amp; Province/);
});

test('email action links reject executable and credential-bearing URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'https://user:password@example.com/reset', '/relative-link']) {
    assert.throws(() => templates.buildPasswordResetEmail('Alex', url), /HTTP or HTTPS/);
    assert.throws(() => templates.buildEmailVerificationEmail('Alex', url), /HTTP or HTTPS/);
  }
});

test('combined price alerts retain every market, date, comparison and reference-only context', () => {
  for (const condition of ['lte', 'gte']) {
    const message = templates.buildPriceAlertEmail('Alex', { ...event, condition });
    for (const market of event.qualifyingMarkets) {
      assert.ok(message.htmlContent.includes(market.marketName)); assert.ok(message.textContent.includes(market.marketName));
      assert.ok(message.htmlContent.includes(market.priceDate)); assert.ok(message.textContent.includes(market.priceDate));
    }
    assert.match(message.htmlContent, /YOUR TARGET · REGION IX/);
    assert.ok(message.textContent.includes(condition === 'gte' ? 'at or above' : 'at or below'));
    assert.match(message.textContent, /does not set or change/);
    assert.match(message.htmlContent, /₱48\.00\/kg/); assert.match(message.htmlContent, /₱49\.00\/kg/);
  }
});

test('price-alert subjects cannot introduce extra email header lines', () => {
  const message = templates.buildPriceAlertEmail('Alex', { ...event, produceName: 'Rice\r\nBcc: test@example.com' });
  assert.doesNotMatch(message.subject, /[\r\n]/);
});

test('configured frontend URLs are used for email actions', () => {
  const previous = process.env.FRONTEND_URL; process.env.FRONTEND_URL = 'https://ardnet.example/app/';
  try {
    assert.match(templates.buildWelcomeEmail('Alex').htmlContent, /href="https:\/\/ardnet\.example\/app\/login"/);
    assert.match(templates.buildPriceAlertEmail('Alex', event).htmlContent, /href="https:\/\/ardnet\.example\/app\/market"/);
  } finally { if (previous === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = previous; }
});

test('email logos use the deployed frontend asset or an explicitly configured public image', () => {
  const previousFrontend = process.env.FRONTEND_URL, previousLogo = process.env.EMAIL_LOGO_URL;
  process.env.FRONTEND_URL = 'https://ardnet.example/app/'; delete process.env.EMAIL_LOGO_URL;
  try {
    for (const message of messages()) assert.match(message.htmlContent, /src="https:\/\/ardnet\.example\/app\/branding\/ARDNET_LOGO\.png"/);
    process.env.EMAIL_LOGO_URL = 'https://images.ardnet.example/logo.png?v=1&size=email';
    for (const message of messages()) assert.match(message.htmlContent, /src="https:\/\/images\.ardnet\.example\/logo\.png\?v=1&amp;size=email"/);
    for (const url of ['file:///C:/logo.svg', 'javascript:alert(1)', 'https://user:password@example.com/logo.png']) {
      process.env.EMAIL_LOGO_URL = url;
      assert.throws(() => templates.buildWelcomeEmail('Alex'), /HTTP or HTTPS/);
    }
  } finally {
    if (previousFrontend === undefined) delete process.env.FRONTEND_URL; else process.env.FRONTEND_URL = previousFrontend;
    if (previousLogo === undefined) delete process.env.EMAIL_LOGO_URL; else process.env.EMAIL_LOGO_URL = previousLogo;
  }
});

test('the email logo asset is a small PNG and local previews resolve it without a public host', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const { createPreviews } = require('../scripts/previewEmails');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ardnet-logo-test-'));
  try {
    const preview = createPreviews(directory), logo = fs.readFileSync(path.join(directory, 'ARDNET_LOGO.png'));
    assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.ok(logo.length < 40 * 1024);
    for (const file of preview.files) assert.match(fs.readFileSync(file, 'utf8'), /class="email-logo" src="ARDNET_LOGO\.png"/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('Brevo senders deliver the matching HTML/plain-text pair and propagate delivery failures', async () => {
  const previousKey = process.env.BREVO_API_KEY, previousSender = process.env.BREVO_SENDER_EMAIL;
  process.env.BREVO_API_KEY = 'test-key'; process.env.BREVO_SENDER_EMAIL = 'sender@example.com';
  const sent = []; let fail = false;
  const load = Module._load; let service;
  try {
    Module._load = function (request, parent, isMain) {
      if (request === '@getbrevo/brevo') return { BrevoClient: class { constructor() { this.transactionalEmails = { sendTransacEmail: async message => { if (fail) throw Error('Delivery unavailable'); sent.push(message); return { messageId: 'test-id' }; } }; } } };
      return load.call(this, request, parent, isMain);
    };
    service = require('../src/services/brevoService');
  } finally { Module._load = load; }
  try {
    await service.sendWelcomeEmail('recipient@example.com', 'Alex');
    await service.sendEmailVerificationEmail('recipient@example.com', 'Alex', verificationUrl);
    await service.sendPasswordResetEmail('recipient@example.com', 'Alex', resetUrl);
    await service.sendPriceAlertEmail('recipient@example.com', 'Alex', event);
    await service.sendTestEmail('recipient@example.com');
    assert.equal(sent.length, 5);
    for (const message of sent) { assert.equal(message.sender.email, 'sender@example.com'); assert.deepEqual(message.to, [{ email: 'recipient@example.com' }]); assert.ok(message.htmlContent && message.textContent); }
    fail = true; await assert.rejects(service.sendPriceAlertEmail('recipient@example.com', 'Alex', event), /Delivery unavailable/);
  } finally {
    if (previousKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previousKey;
    if (previousSender === undefined) delete process.env.BREVO_SENDER_EMAIL; else process.env.BREVO_SENDER_EMAIL = previousSender;
  }
});
