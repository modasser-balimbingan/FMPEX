const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function emailUrl(value) {
  let parsed;
  try { parsed = new URL(String(value)); } catch { throw new Error('Email action URL must be an absolute HTTP or HTTPS URL.'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Email action URL must use HTTP or HTTPS.');
  return parsed.href;
}

function frontendUrl(route = '') {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return emailUrl(base + '/' + route.replace(/^\/+/, ''));
}

const paragraph = value => `<p class="email-text" style="margin:0 0 18px;color:#61735c;font-size:16px;line-height:1.75;overflow-wrap:break-word;">${escapeHtml(value)}</p>`;
const noteBox = value => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;table-layout:fixed;"><tr><td class="email-soft email-text" style="padding:17px 19px;border:1px solid #dce8d2;border-radius:10px;background-color:#f2f7eb;color:#617553;font-size:13px;line-height:1.8;overflow-wrap:break-word;">${escapeHtml(value)}</td></tr></table>`;

// Inline styles and presentation tables provide the baseline layout. The media
// rules enhance clients that support them. The PNG logo uses a public URL because
// email clients do not reliably display SVG or data URLs. Set EMAIL_LOGO_URL to a
// publicly hosted PNG when developing locally; deployed sites serve the default
// /branding/ARDNET_LOGO.png asset through FRONTEND_URL. No scripts or fonts load.
function renderEmail({ subject, preheader, kicker, title, bodyHtml, text, action, secondary, note, reason, fallbackLink = false }) {
  const actionUrl = action ? emailUrl(action.url) : null;
  const secondaryUrl = secondary ? emailUrl(secondary.url) : null;
  const safeAction = actionUrl && escapeHtml(actionUrl);
  const home = escapeHtml(frontendUrl());
  const logoUrl = escapeHtml(emailUrl(process.env.EMAIL_LOGO_URL || frontendUrl('branding/ARDNET_LOGO.png')));
  const actionsHtml = action ? `<table class="email-action" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;max-width:100%;"><tr><td align="center" bgcolor="#3c8752" style="border-radius:9px;background-color:#3c8752;mso-padding-alt:15px 23px;"><a href="${safeAction}" target="_blank" class="email-button" style="display:inline-block;padding:15px 23px;border:1px solid #3c8752;border-radius:9px;color:#ffffff;font-size:15px;font-weight:bold;line-height:1.5;text-decoration:none;text-align:center;">${escapeHtml(action.text)}&nbsp; &#8594;</a></td></tr></table>` : '';
  const secondaryHtml = secondary ? `<p style="margin:19px 0 0;font-size:14px;line-height:1.7;"><a class="email-link" href="${escapeHtml(secondaryUrl)}" target="_blank" style="color:#467b43;text-decoration:underline;">${escapeHtml(secondary.text)}</a></p>` : '';
  const fallbackHtml = fallbackLink && action ? `<p class="email-muted" style="margin:23px 0 8px;color:#7b8970;font-size:12px;line-height:1.8;">Button not opening? Copy this link into your browser:</p><p style="margin:0;font-size:12px;line-height:1.8;word-break:break-all;overflow-wrap:anywhere;"><a class="email-link" href="${safeAction}" style="color:#527e45;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${safeAction}</a></p>` : '';
  const htmlContent = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(subject)}</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}body{margin:0;padding:0;width:100%!important;}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;}
  @media only screen and (max-width:620px){.email-outer-pad{padding:20px 12px!important;}.email-brand-pad{padding:23px 22px!important;}.email-body{padding:28px 22px!important;}h1.email-heading{font-size:28px!important;}.email-action{width:100%!important;}.email-button{display:block!important;padding:14px 15px!important;}.email-footer{padding:21px 22px!important;}.email-market-pad{padding:17px!important;}}
  @media (prefers-color-scheme:dark){.email-bg{background-color:#111d16!important;}.email-card,.email-brand-pad{background-color:#1a2a20!important;border-color:#385039!important;}.email-heading,.email-brand-name{color:#e0ebd8!important;}.email-text{color:#b7cbb0!important;}.email-muted{color:#a1b596!important;}.email-soft,.email-market{background-color:#253c28!important;border-color:#405b39!important;}.email-kicker,.email-link,.email-price{color:#b4d998!important;}.email-footer{background-color:#17261b!important;border-color:#385039!important;}}
</style></head>
<body class="email-bg" bgcolor="#f3f7ef" style="margin:0;padding:0;background-color:#f3f7ef;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" bgcolor="#f3f7ef" style="width:100%;background-color:#f3f7ef;table-layout:fixed;"><tr><td class="email-outer-pad" align="center" style="padding:34px 16px;">
<!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" bgcolor="#ffffff" style="width:100%;max-width:600px;border:1px solid #dce6d3;border-radius:17px;background-color:#ffffff;table-layout:fixed;font-family:Arial,Helvetica,sans-serif;">
<tr><td height="6" bgcolor="#4b9156" style="height:6px;line-height:6px;font-size:1px;background-color:#4b9156;border-radius:17px 17px 0 0;">&nbsp;</td></tr>
<tr><td class="email-brand-pad" style="padding:28px 34px;border-bottom:1px solid #e5ecdd;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="52" height="53" align="center" valign="middle" style="width:52px;height:53px;"><a href="${home}" style="text-decoration:none;"><img class="email-logo" src="${logoUrl}" width="52" height="53" alt="ArdNet logo" border="0" style="display:block;width:52px;height:53px;border:0;outline:none;text-decoration:none;"></a></td><td style="padding-left:12px;"><a href="${home}" class="email-brand-name" style="color:#2d573b;font-size:25px;font-weight:bold;text-decoration:none;letter-spacing:-.8px;">ArdNet</a><p class="email-muted" style="margin:4px 0 0;color:#7b8b6d;font-size:11px;line-height:1.5;">Farm-to-Market Price Exchange</p></td></tr></table></td></tr>
<tr><td class="email-body" style="padding:34px;font-family:Arial,Helvetica,sans-serif;"><p class="email-kicker" style="margin:0 0 13px;color:#63934d;font-size:11px;font-weight:bold;letter-spacing:1.6px;line-height:1.7;">${escapeHtml(kicker)}</p><h1 class="email-heading" style="margin:0 0 22px;color:#2a5338;font-size:32px;font-weight:bold;line-height:1.25;letter-spacing:-.8px;overflow-wrap:break-word;">${escapeHtml(title)}</h1>
${bodyHtml}${actionsHtml}${secondaryHtml}${note ? noteBox(note) : ''}${fallbackHtml}
<p class="email-text" style="margin:29px 0 0;color:#64765b;font-size:14px;line-height:1.8;">See you around the community,<br><strong class="email-heading" style="color:#395e3e;">The ArdNet team</strong></p></td></tr>
<tr><td class="email-footer" bgcolor="#f7faf3" style="padding:23px 34px;background-color:#f7faf3;border-top:1px solid #e1e9d9;border-radius:0 0 17px 17px;"><p class="email-muted" style="margin:0 0 9px;color:#7d8a70;font-size:12px;line-height:1.8;overflow-wrap:break-word;">${escapeHtml(reason)}</p><p class="email-muted" style="margin:0;color:#7d8a70;font-size:11px;line-height:1.8;">© ${new Date().getFullYear()} ArdNet · Connecting farms. Growing possibilities.</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return {
    subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200),
    htmlContent,
    textContent: [title, text, action && `${action.text}: ${actionUrl}`, secondary && `${secondary.text}: ${secondaryUrl}`, note, 'The ArdNet team', reason].filter(Boolean).join('\n\n'),
  };
}

module.exports = { renderEmail, escapeHtml, paragraph, frontendUrl };
