const { renderEmail, escapeHtml, paragraph, frontendUrl } = require('./emailLayout');
const { buildCombinedPriceAlertContent, formatPrice } = require('./priceAlertContent');
const nameOf = firstName => String(firstName || 'there');
const greeting = firstName => `Hi ${nameOf(firstName)},`;

function buildWelcomeEmail(firstName) {
  const intro = 'Your email is verified, and your ArdNet account is ready. We’re glad you’re here.';
  const features = [
    ['01', 'Discover local produce', 'Explore listings from farmers in your community.'],
    ['02', 'See the market clearly', 'Use reference prices to put your next decision in context.'],
    ['03', 'Keep your targets close', 'Create price alerts and follow the changes that matter to you.'],
  ];
  const featureHtml = features.map(([number, title, copy]) => `<tr><td width="34" valign="top" class="email-kicker" style="width:34px;padding:15px 0;border-top:1px solid #e1e9d9;color:#68904f;font-size:12px;line-height:1.8;">${number}</td><td style="padding:15px 0;border-top:1px solid #e1e9d9;"><strong class="email-heading" style="color:#3b6241;font-size:15px;line-height:1.7;">${title}</strong><p class="email-text" style="margin:4px 0 0;color:#6d7e60;font-size:13px;line-height:1.8;">${copy}</p></td></tr>`).join('');
  return renderEmail({ subject: 'Welcome to ArdNet!', preheader: 'Your account is ready. A fresh connection starts here.', kicker: 'WELCOME TO THE COMMUNITY', title: 'Good things grow here.',
    bodyHtml: paragraph(greeting(firstName)) + paragraph(intro) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;margin:24px 0 0;">${featureHtml}</table>`,
    text: `${greeting(firstName)}\n\n${intro}\n\n${features.map(([, title, copy]) => `${title}: ${copy}`).join('\n')}`,
    action: { text: 'Sign in to ArdNet', url: frontendUrl('login') }, secondary: { text: 'Explore the local market', url: frontendUrl('listings') },
    reason: 'You received this welcome message after verifying your ArdNet email address.' });
}

function buildEmailVerificationEmail(firstName, verificationUrl) {
  const intro = 'Thanks for joining ArdNet. Confirm your email address to activate sign-in and start connecting with your local market.';
  return renderEmail({ subject: 'Verify your ArdNet email address', preheader: 'One small step to your ArdNet community. Verify your email within 24 hours.', kicker: 'ONE LAST STEP', title: 'Let’s make it official.',
    bodyHtml: paragraph(greeting(firstName)) + paragraph(intro), text: `${greeting(firstName)}\n\n${intro}`,
    action: { text: 'Verify email address', url: verificationUrl }, fallbackLink: true,
    note: 'This verification link expires in 24 hours. If you didn’t create an ArdNet account, you can ignore this email.',
    reason: 'You received this because an ArdNet account was registered with this email, or a new verification link was requested.' });
}

function buildPasswordResetEmail(firstName, resetUrl) {
  const intro = 'We received a request to reset your ArdNet password. Select the button below to choose a fresh password and return to your community.';
  return renderEmail({ subject: 'Reset your ArdNet password', preheader: 'A fresh start for your account. Your reset link is valid for 20 minutes.', kicker: 'ACCOUNT RECOVERY', title: 'A fresh password starts here.',
    bodyHtml: paragraph(greeting(firstName)) + paragraph(intro), text: `${greeting(firstName)}\n\n${intro}`,
    action: { text: 'Reset password', url: resetUrl }, fallbackLink: true,
    note: 'This link expires in 20 minutes and works once. If you didn’t request it, you can ignore this email. Your password stays the same until you choose a new one.',
    reason: 'You received this because a password reset was requested for your ArdNet account.' });
}

function marketPlace(market) {
  const parts = String(market.location).split(',').map(value => value.trim()).filter(Boolean);
  if (market.province && !parts.some(part => part.toLowerCase() === String(market.province).trim().toLowerCase())) parts.push(market.province);
  return parts.join(', ');
}

function buildPriceAlertEmail(firstName, event) {
  const details = buildCombinedPriceAlertContent(event);
  const comparison = event.condition === 'gte' ? 'At or above' : 'At or below';
  const target = formatPrice(event.targetPrice, event.unit);
  const cards = event.qualifyingMarkets.map(market => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-market" style="width:100%;margin:14px 0 0;border:1px solid #dce6d3;border-radius:11px;background-color:#f8fbf4;table-layout:fixed;"><tr><td class="email-market-pad" style="padding:20px;"><h2 class="email-heading" style="margin:0 0 7px;color:#3a6040;font-size:17px;line-height:1.6;overflow-wrap:break-word;">${escapeHtml(market.marketName)}</h2><p class="email-muted" style="margin:0 0 13px;color:#7d8b70;font-size:13px;line-height:1.8;overflow-wrap:break-word;">${escapeHtml(marketPlace(market))}</p><p class="email-price" style="margin:0;color:#4d7e40;font-size:25px;font-weight:bold;line-height:1.6;overflow-wrap:break-word;">${escapeHtml(formatPrice(market.price, event.unit))}</p><p class="email-muted" style="margin:5px 0 0;color:#7d8b70;font-size:12px;line-height:1.8;">${market.priceDate ? 'Reference date: ' + escapeHtml(String(market.priceDate).slice(0, 10)) : 'Reference date not supplied'}</p></td></tr></table>`).join('');
  const targetHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-soft" style="width:100%;margin:22px 0;border:1px solid #d6e6c8;border-radius:11px;background-color:#edf5e4;table-layout:fixed;"><tr><td style="padding:21px;"><p class="email-kicker" style="margin:0 0 9px;color:#6a8e50;font-size:11px;font-weight:bold;letter-spacing:1px;line-height:1.7;">YOUR TARGET · REGION IX</p><p class="email-heading" style="margin:0;color:#355c3c;font-size:18px;font-weight:bold;line-height:1.7;overflow-wrap:break-word;">${escapeHtml(event.produceName)}</p><p class="email-text" style="margin:4px 0 0;color:#688056;font-size:15px;line-height:1.8;overflow-wrap:break-word;">${comparison} ${escapeHtml(target)}</p></td></tr></table>`;
  return renderEmail({ subject: `ArdNet regional price alert: ${event.produceName}`, preheader: details.summary, kicker: 'YOUR MARKET WATCH', title: 'A price worth a closer look.',
    bodyHtml: paragraph(greeting(firstName)) + paragraph(details.summary) + targetHtml + cards,
    text: `${greeting(firstName)}\n\n${details.message}`, action: { text: 'View market prices', url: frontendUrl('market') }, secondary: { text: 'Manage your price alerts', url: frontendUrl('alerts') },
    note: 'These are reference prices only. ArdNet does not set or change your produce’s selling price. Check the reference date for each market before making a decision.',
    reason: 'You received this because a reference price matched one of your active ArdNet price alerts in Region IX.' });
}

function buildTestEmail() {
  return renderEmail({ subject: 'ArdNet Brevo Integration Test', preheader: 'Your ArdNet email connection is working.', kicker: 'EMAIL DELIVERY CHECK', title: 'A connection worth keeping.',
    bodyHtml: paragraph('Your ArdNet email connection is working. This test message confirms that ArdNet can send email through Brevo.'),
    text: 'Your ArdNet email connection is working. This test message confirms that ArdNet can send email through Brevo.',
    action: { text: 'Visit ArdNet', url: frontendUrl() }, reason: 'You received this because an ArdNet email integration test was requested.' });
}

module.exports = { buildWelcomeEmail, buildEmailVerificationEmail, buildPasswordResetEmail, buildPriceAlertEmail, buildTestEmail };
