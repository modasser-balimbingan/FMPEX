const pool = require('../config/database');
const { getNotificationColumns } = require('../services/notificationSchema');
const { ensureWelcomeNotification } = require('../services/accountNotifications');

exports.getUserNotifications = async (req, res) => {
  try {
    const c = await getNotificationColumns();
    if (['farmer', 'buyer'].includes(req.user.role)) await ensureWelcomeNotification(pool, req.user.id);
    const result = await pool.query(
      `SELECT ${c.id} AS notification_id,
              ${c.userId} AS user_id,
              ${c.title} AS title,
              ${c.message} AS message,
              ${c.status} AS status,
              ${c.createdAt} AS created_at,
              ${c.readAt} AS read_at,
              ${c.emailStatus} AS email_status,
              ${c.emailAttempts} AS email_attempts,
              ${c.emailSentAt} AS email_sent_at
       FROM public.notifications
       WHERE ${c.userId} = $1
       ORDER BY ${c.createdAt} DESC, ${c.id} DESC
       `,
      [req.user.id]
    );
    res.set('Cache-Control', 'no-store');
    return res.json({ notifications: result.rows, accountStatus: req.accountStatus || 'active' });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const c = await getNotificationColumns();
    const result = await pool.query(
      `UPDATE public.notifications
       SET ${c.status} = 'Read', ${c.readAt} = NOW()
       WHERE ${c.userId} = $1 AND ${c.status} = 'Unread'
       RETURNING ${c.id}`,
      [req.user.id]
    );
    return res.json({ message: 'Notifications marked as read', updated: result.rowCount });
  } catch (error) {
    console.error('Mark notifications read error:', error.message);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
};
