const crypto = require('node:crypto');
const { getNotificationColumns } = require('./notificationSchema');

async function createAccountNotification(db, { userId, eventKey, title, message }) {
  const c = await getNotificationColumns();
  const eventId = crypto.createHash('sha256').update(eventKey).digest('hex');
  await db.query(`INSERT INTO public.notifications
    (${c.userId}, ${c.title}, ${c.message}, ${c.status}, ${c.eventId}, ${c.emailStatus})
    VALUES ($1, $2, $3, 'Unread', $4, 'not_applicable') ON CONFLICT DO NOTHING`,
  [userId, title, message, eventId]);
}

function ensureWelcomeNotification(db, userId) {
  return createAccountNotification(db, { userId, eventKey: `account-welcome:${userId}`,
    title: 'Welcome to ArdNet', message: 'Your local market is a little closer. Explore produce, follow reference prices, and create your own price alerts.' });
}

module.exports = { createAccountNotification, ensureWelcomeNotification };
