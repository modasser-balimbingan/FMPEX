const { BrevoClient } = require('@getbrevo/brevo');
const { buildWelcomeEmail, buildEmailVerificationEmail, buildPasswordResetEmail, buildPriceAlertEmail, buildTestEmail } = require('./emailTemplates');

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
if (!apiKey || !senderEmail) throw new Error('Missing BREVO_API_KEY or BREVO_SENDER_EMAIL in .env');
const brevo = new BrevoClient({ apiKey });

function deliver(recipientEmail, content) {
  return brevo.transactionalEmails.sendTransacEmail({
    sender: { name: 'ArdNet', email: senderEmail },
    to: [{ email: recipientEmail }],
    ...content,
  });
}

async function sendTestEmail(recipientEmail) { return deliver(recipientEmail, buildTestEmail()); }
async function sendWelcomeEmail(recipientEmail, firstName) { return deliver(recipientEmail, buildWelcomeEmail(firstName)); }
async function sendEmailVerificationEmail(recipientEmail, firstName, verificationUrl) { return deliver(recipientEmail, buildEmailVerificationEmail(firstName, verificationUrl)); }
async function sendPasswordResetEmail(recipientEmail, firstName, resetUrl) { return deliver(recipientEmail, buildPasswordResetEmail(firstName, resetUrl)); }
async function sendPriceAlertEmail(recipientEmail, firstName, event) { return deliver(recipientEmail, buildPriceAlertEmail(firstName, event)); }

module.exports = { sendTestEmail, sendWelcomeEmail, sendEmailVerificationEmail, sendPasswordResetEmail, sendPriceAlertEmail };
