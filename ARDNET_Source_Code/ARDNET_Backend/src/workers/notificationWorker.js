const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const amqp = require('amqplib');
const pool = require('../config/database');
const { sendPriceAlertEmail } = require('../services/brevoService');
const { getNotificationColumns } = require('../services/notificationSchema');
const { validateCombinedEvent, buildCombinedPriceAlertContent } = require('../services/priceAlertContent');
const { QUEUE, RETRY_QUEUE, ensureTopology } = require('../services/rabbitmqTopology');

const requestedAttempts = Number(process.env.RABBITMQ_EMAIL_MAX_ATTEMPTS || 5);
const MAX_ATTEMPTS = Number.isSafeInteger(requestedAttempts) && requestedAttempts > 0 ? requestedAttempts : 5;

async function getOrCreateNotification(event) {
  validateCombinedEvent(event);
  const c = await getNotificationColumns();
  const content = buildCombinedPriceAlertContent(event);
  // notifications has no alert_id, type, or is_read column. One notification
  // corresponds to one unique event_id, stored using the migrated schema.
  const inserted = await pool.query(
    `INSERT INTO public.notifications
       (${c.userId}, ${c.title}, ${c.message}, ${c.status}, ${c.createdAt},
        ${c.eventId}, ${c.emailStatus}, ${c.emailAttempts})
     VALUES ($1, $2, $3, 'Unread', NOW(), $4, 'pending', 0)
     ON CONFLICT DO NOTHING
     RETURNING ${c.id} AS notification_id, ${c.emailStatus} AS email_status,
               ${c.emailAttempts} AS email_attempts`,
    [event.userId, content.title, content.message, event.eventId]
  );
  if (inserted.rows.length) return inserted.rows[0];

  const existing = await pool.query(
    `SELECT ${c.id} AS notification_id, ${c.emailStatus} AS email_status,
            ${c.emailAttempts} AS email_attempts
     FROM public.notifications WHERE ${c.eventId} = $1 LIMIT 1`,
    [event.eventId]
  );
  if (!existing.rows.length) throw new Error(`Unable to insert/find notification for event ${event.eventId}`);
  return existing.rows[0];
}

async function processPriceAlertEvent(event) {
  validateCombinedEvent(event);
  const notification = await getOrCreateNotification(event);
  const c = await getNotificationColumns();
  const status = String(notification.email_status || '').toLowerCase();
  if (status === 'sent' || status === 'failed') {
    console.log(`[Notification worker] Event ${event.eventId} already ${status}; duplicate skipped.`);
    return { done: true, skipped: true };
  }

  if (Number(notification.email_attempts) >= MAX_ATTEMPTS) {
    await pool.query(
      `UPDATE public.notifications SET ${c.emailStatus} = 'failed',
       ${c.emailLastError} = COALESCE(${c.emailLastError}, 'Maximum email attempts reached')
       WHERE ${c.eventId} = $1 AND ${c.emailStatus} <> 'sent'`,
      [event.eventId]
    );
    return { done: true, exhausted: true };
  }

  const result = await pool.query(
    'SELECT email, first_name, status FROM public.users WHERE user_id = $1 LIMIT 1',
    [event.userId]
  );
  const user = result.rows[0];
  if (!user || String(user.status).toLowerCase() !== 'active' || !user.email) {
    await pool.query(
      `UPDATE public.notifications SET ${c.emailStatus} = 'failed', ${c.emailLastError} = $2
       WHERE ${c.eventId} = $1`,
      [event.eventId, 'No active recipient email is available']
    );
    console.warn(`[Notification worker] Event ${event.eventId}: no active email recipient.`);
    return { done: true, missingRecipient: true };
  }

  // Persist attempt BEFORE calling Brevo: retry limits survive worker restarts.
  // A crash after Brevo accepts the email but before the 'sent' DB update can
  // still cause a duplicate email on redelivery (at-least-once semantics).
  const attempt = await pool.query(
    `UPDATE public.notifications
     SET ${c.emailStatus} = 'sending', ${c.emailAttempts} = ${c.emailAttempts} + 1,
         ${c.emailLastError} = NULL
     WHERE ${c.eventId} = $1 AND ${c.emailAttempts} < $2
       AND (${c.emailStatus} IS NULL OR ${c.emailStatus} NOT IN ('sent', 'failed'))
     RETURNING ${c.emailAttempts} AS email_attempts`,
    [event.eventId, MAX_ATTEMPTS]
  );
  if (!attempt.rows.length) return { done: true, skipped: true };
  const attemptsSoFar = Number(attempt.rows[0].email_attempts);

  try {
    await sendPriceAlertEmail(user.email, user.first_name, event);
  } catch (error) {
    const exhausted = attemptsSoFar >= MAX_ATTEMPTS;
    await pool.query(
      `UPDATE public.notifications SET ${c.emailStatus} = $2, ${c.emailLastError} = $3
       WHERE ${c.eventId} = $1`,
      [event.eventId, exhausted ? 'failed' : 'retrying', String(error.message || error).slice(0, 2000)]
    );
    if (exhausted) {
      console.error(`[Notification worker] Email exhausted ${attemptsSoFar} attempts for ${event.eventId}`);
      return { done: true, exhausted: true };
    }
    return { retry: true, nextRetryCount: attemptsSoFar };
  }

  // A failure here is a processing error: the transport retry mechanism will
  // try again. Do not claim 'sent' if the DB update fails.
  await pool.query(
    `UPDATE public.notifications
     SET ${c.emailStatus} = 'sent', ${c.emailSentAt} = NOW(), ${c.emailLastError} = NULL
     WHERE ${c.eventId} = $1`,
    [event.eventId]
  );
  console.log(`[Notification worker] Saved combined notification and Brevo accepted event ${event.eventId} (${event.qualifyingMarkets.length} markets).`);
  return { done: true };
}

async function startWorker() {
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const connection = await amqp.connect(url);
  connection.on('error', (error) => console.error('[Notification worker] RabbitMQ error:', error.message));
  connection.on('close', () => {
    console.error('[Notification worker] RabbitMQ connection closed. Restart worker after reconnecting.');
    process.exitCode = 1;
  });
  const channel = await connection.createConfirmChannel();
  await ensureTopology(channel);
  await channel.prefetch(1);
  console.log(`[Notification worker] Listening for combined Region IX events on ${QUEUE}`);

  await channel.consume(QUEUE, async (message) => {
    if (!message) return;
    let event;
    const headerRetry = Math.max(0, Number(message.properties.headers?.['x-retry-count'] || 0) || 0);
    try {
      event = JSON.parse(message.content.toString('utf8'));
      validateCombinedEvent(event);
      const outcome = await processPriceAlertEvent(event);
      if (outcome.retry) {
        channel.sendToQueue(RETRY_QUEUE, Buffer.from(JSON.stringify(event)), {
          persistent: true,
          contentType: 'application/json',
          messageId: event.eventId,
          headers: { 'x-retry-count': headerRetry + 1 },
        });
        await channel.waitForConfirms();
      }
      channel.ack(message);
    } catch (error) {
      console.error('[Notification worker] Message error:', error.message);
      if (error.invalidEvent || !event) {
        // Malformed or old single-market message: dead-letter, do not retry.
        channel.nack(message, false, false);
        return;
      }
      if (headerRetry + 1 >= MAX_ATTEMPTS) {
        // Processing failure (e.g., DB unavailable), not a Brevo failure.
        // Send to dead queue for inspection instead of acknowledging loss.
        channel.nack(message, false, false);
        return;
      }
      try {
        channel.sendToQueue(RETRY_QUEUE, Buffer.from(JSON.stringify(event)), {
          persistent: true,
          contentType: 'application/json',
          messageId: event.eventId,
          headers: { 'x-retry-count': headerRetry + 1 },
        });
        await channel.waitForConfirms();
        channel.ack(message);
      } catch (retryError) {
        // Do NOT acknowledge if publishing the retry could not be confirmed.
        console.error('[Notification worker] Retry queue publish failed:', retryError.message);
        channel.nack(message, false, true);
      }
    }
  }, { noAck: false });
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error('[Notification worker] Could not start:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { processPriceAlertEvent, getOrCreateNotification, startWorker };
