
const pool = require('../config/database');

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a."auditId" AS audit_id,
        a.user_id,
        u.user_name AS actor_name,
        u.email AS actor_email,
        a.action,
        a."entityName" AS entity_name,
        a."entityId" AS entity_id,
        a.description,
        a."ipAddress" AS ip_address,
        a."createdAt" AS created_at
      FROM public.audit_logs AS a
      LEFT JOIN public.users AS u
        ON u.user_id = a.user_id
      ORDER BY a."createdAt" DESC
      LIMIT 100
    `);

    res.json({
      count: result.rows.length,
      auditLogs: result.rows,
    });
  } catch (error) {
    console.error('Get audit logs error:', error.message);

    res.status(500).json({
      error: 'Failed to retrieve audit logs',
    });
  }
};
