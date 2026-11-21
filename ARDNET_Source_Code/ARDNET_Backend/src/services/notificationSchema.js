const pool = require('../config/database');

let cachedColumns;

function normalize(name) {
  return String(name).replace(/_/g, '').toLowerCase();
}

function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function getNotificationColumns() {
  if (cachedColumns) return cachedColumns;
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'notifications'`
  );
  const lookup = new Map(result.rows.map((row) => [normalize(row.column_name), row.column_name]));
  const required = (name) => {
    const actual = lookup.get(normalize(name));
    if (!actual) throw new Error(`notifications is missing '${name}'. Verify the Region IX migration in the current database.`);
    return quoteIdentifier(actual);
  };
  
  // These are the EXACT fields in the approved existing table plus
  // the Region IX migration. Do not expect alert_id, is_read, or type.
  cachedColumns = {
    id: required('notification_id'),
    userId: required('user_id'),
    title: required('title'),
    message: required('message'),
    status: required('status'),
    createdAt: required('created_at'),
    readAt: required('read_at'),
    eventId: required('event_id'),
    emailStatus: required('email_status'),
    emailAttempts: required('email_attempts'),
    emailLastError: required('email_last_error'),
    emailSentAt: required('email_sent_at'),
  };
  return cachedColumns;
}

module.exports = { getNotificationColumns };
