
const pool = require('../config/database');
const crypto = require('node:crypto');
const { createAccountNotification } = require('../services/accountNotifications');

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search = '', role = '', status = '' } = req.query;

    const conditions = [];
    const values = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(u.user_name ILIKE $${values.length}
          OR u.email ILIKE $${values.length})`
      );
    }

    if (role.trim()) {
      values.push(role.trim());
      conditions.push(`r.role_name = $${values.length}`);
    }

    if (status.trim()) {
      values.push(status.trim().toLowerCase());
      conditions.push(`LOWER(u.status) = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await pool.query(
      `
        SELECT
          u.user_id,
          u.user_name,
          u.email,
          u.first_name,
          u.last_name,
          u.status,
          u.email_verified,
          u.created_at,
          u.updated_at,
          r.role_name
        FROM public.users u
        JOIN public.roles r ON r.role_id = u.role_id
        ${whereClause}
        ORDER BY u.created_at DESC, u.user_id DESC
      `,
      values
    );

    return res.json({
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('Get admin users error:', error.message);

    return res.status(500).json({
      error: 'Failed to retrieve users',
    });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  const targetId = Number(req.params.id);
  const actorId = Number(req.user.id);
  const { status } = req.body;

  if (!Number.isSafeInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!['active', 'suspended'].includes(
    typeof status === 'string' ? status.toLowerCase() : ''
  )) {
    return res.status(400).json({
      error: 'Status must be active or suspended',
    });
  }

  const newStatus = status.toLowerCase();

  // Prevent an administrator from suspending their own account.
  if (targetId === actorId && newStatus === 'suspended') {
    return res.status(400).json({
      error: 'You cannot suspend your own account',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `
        SELECT user_id, user_name, status
        FROM public.users
        WHERE user_id = $1
        FOR UPDATE
      `,
      [targetId]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const previous = existing.rows[0];
    const previousStatus = String(previous.status).toLowerCase();

    if (previousStatus === newStatus) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `User is already ${newStatus}`,
      });
    }

    // Never allow the system to end up without an active administrator.
    if (newStatus === 'suspended') {
      const targetRole = await client.query(
        `SELECT r.role_name
         FROM public.users u
         JOIN public.roles r ON r.role_id = u.role_id
         WHERE u.user_id = $1`,
        [targetId]
      );

      if (targetRole.rows[0]?.role_name === 'Administrator') {
        const activeAdmins = await client.query(
          `SELECT COUNT(*)::int AS count
           FROM public.users u
           JOIN public.roles r ON r.role_id = u.role_id
           WHERE r.role_name = 'Administrator'
             AND LOWER(u.status) = 'active'`
        );

        if (activeAdmins.rows[0].count <= 1) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'The last active administrator cannot be suspended.',
          });
        }
      }
    }

    const updated = await client.query(
      `
        UPDATE public.users
        SET status = $1,
            updated_at = NOW()
        WHERE user_id = $2
        RETURNING user_id, user_name, email, role_id,
                  status, email_verified, created_at, updated_at
      `,
      [newStatus, targetId]
    );

    const user = updated.rows[0];

    const roleResult = await client.query(
      `SELECT role_name FROM public.roles WHERE role_id = $1`,
      [user.role_id]
    );

    user.role_name = roleResult.rows[0]?.role_name || 'Unknown';

    await createAccountNotification(client, {
      userId: targetId,
      eventKey: `account-status:${targetId}:${newStatus}:${crypto.randomUUID()}`,
      title: newStatus === 'suspended' ? 'Account suspended' : 'Account reactivated',
      message: newStatus === 'suspended'
        ? 'An administrator suspended your account. Dashboard actions are unavailable. You can still read your notifications. Contact ArdNet support for assistance.'
        : 'Your account is active again. You can return to your listings, favorites, and price alerts.',
    });

    await client.query(
      `
        INSERT INTO public.audit_logs
          (user_id, action, "entityName", "entityId",
           description, "ipAddress")
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        actorId,
        newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE',
        'Users',
        targetId,
        `Administrator changed ${previous.user_name}'s account status from ${previous.status} to ${newStatus}.`,
        req.ip || null,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      message: `User account ${newStatus} successfully`,
      user,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    console.error('Update user status error:', error.message);

    return res.status(500).json({
      error: 'Failed to update user status',
    });
  } finally {
    client.release();
  }
};
