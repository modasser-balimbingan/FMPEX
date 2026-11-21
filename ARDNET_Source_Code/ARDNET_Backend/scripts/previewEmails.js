// Local previews only: no .env, database, Brevo client, or email delivery.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const templates = require('../src/services/emailTemplates');

function createPreviews(directory = path.join(os.tmpdir(), 'ardnet-email-previews')) {
  const base = 'https://ardnet.example';
  const event = { eventType: 'regional-price-alert', eventVersion: 2, eventId: 'a'.repeat(64), alertId: 1, userId: 11, regionCode: 'IX', produceName: 'Rice', unit: 'kg', targetPrice: 50, condition: 'lte', qualifyingMarkets: [
    { marketName: 'Sample Pagadian Market', location: 'Pagadian City', province: 'Zamboanga del Sur', price: 48, unit: 'kg', priceDate: '2026-11-17' },
    { marketName: 'Sample Dipolog Market', location: 'Dipolog City', province: 'Zamboanga del Norte', price: 49, unit: 'kg', priceDate: '2026-11-16' },
  ] };
  const messages = {
    welcome: templates.buildWelcomeEmail('Alex'),
    verification: templates.buildEmailVerificationEmail('Alex', base + '/verify-email?token=preview-verification-link'),
    'password-reset': templates.buildPasswordResetEmail('Alex', base + '/reset-password?token=preview-reset-link'),
    'price-alert': templates.buildPriceAlertEmail('Alex', event),
    'connection-test': templates.buildTestEmail(),
  };
  fs.mkdirSync(directory, { recursive: true });
  // Local previews use the same PNG without needing a public image host.
  fs.copyFileSync(path.resolve(__dirname, '../../ARDNET_Frontend/public/branding/ARDNET_LOGO.png'), path.join(directory, 'ARDNET_LOGO.png'));
  for (const [name, content] of Object.entries(messages)) {
    fs.writeFileSync(path.join(directory, name + '.html'), content.htmlContent.replace(/(<img class="email-logo" src=")[^"]*"/, '$1ARDNET_LOGO.png"'));
    fs.writeFileSync(path.join(directory, name + '.txt'), content.textContent);
  }
  return { directory, files: Object.keys(messages).map(name => path.join(directory, name + '.html')) };
}
if (require.main === module) console.log(JSON.stringify(createPreviews(process.argv[2]), null, 2));
module.exports = { createPreviews };
