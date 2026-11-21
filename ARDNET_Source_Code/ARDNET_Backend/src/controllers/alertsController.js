const pool = require('../config/database');

// Region IX is the monitoring scope of this stage of ARDNET.
const REGION_CODE = 'IX';

function normalizeCondition(input) {
  const value = String(input ?? '').trim().toLowerCase();
  if (['>=', 'gte', 'at-or-above'].includes(value)) return '>=';
  if (['<=', 'lte', 'at-or-below'].includes(value)) return '<=';
  return null;
}

function normalizeStatus(input) {
  const value = String(input ?? '').trim().toLowerCase();
  if (value === 'active') return 'Active';
  if (value === 'inactive') return 'Inactive';
  return null;
}

function isPositivePrice(input) {
  if (input === null || input === undefined || String(input).trim() === '') return false;
  const number = Number(input);
  return Number.isFinite(number) && number > 0;
}

function isValidName(input, maxLength) {
  return typeof input === 'string' && input.trim().length > 0 && input.trim().length <= maxLength;
}

function parseAlertId(raw) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

exports.createAlert = async (req, res) => {
  try {
    const { produce_name, target_price, condition, unit, region_code } = req.body || {};

    if (!isValidName(produce_name, 100) || !isValidName(unit, 30) || !isPositivePrice(target_price)) {
      return res.status(400).json({ error: 'Provide a valid produce name, positive target price, and unit.' });
    }
    const sqlCondition = normalizeCondition(condition);
    if (!sqlCondition) {
      return res.status(400).json({ error: 'Condition must be gte/lte or >=/<=.' });
    }
    if (region_code != null && String(region_code).trim().toUpperCase() !== REGION_CODE) {
      return res.status(400).json({ error: 'Only Region IX alerts are supported at this stage.' });
    }

    const result = await pool.query(
      `INSERT INTO public.price_alerts
         (user_id, market_price_id, produce_name, target_price, condition, unit, region_code, status, created_at)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, 'Active', NOW())
       RETURNING *`,
      [req.user.id, produce_name.trim(), Number(target_price), sqlCondition, unit.trim(), REGION_CODE]
    );
    res.set('Cache-Control', 'no-store');
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create alert error:', error.message);
    return res.status(500).json({ error: 'Failed to create alert' });
  }
};

exports.getUserAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.price_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC, alert_id DESC`,
      [req.user.id]
    );
    res.set('Cache-Control', 'no-store');
    return res.json(result.rows);
  } catch (error) {
    console.error('Get user alerts error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const id = parseAlertId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid alert ID' });
    const body = req.body || {};
    const { produce_name, target_price, condition, unit, status, region_code } = body;

    if (produce_name !== undefined && !isValidName(produce_name, 100)) {
      return res.status(400).json({ error: 'Invalid produce name' });
    }
    if (unit !== undefined && !isValidName(unit, 30)) {
      return res.status(400).json({ error: 'Invalid unit' });
    }
    if (target_price !== undefined && !isPositivePrice(target_price)) {
      return res.status(400).json({ error: 'Target price must be positive' });
    }
    const sqlCondition = condition === undefined ? null : normalizeCondition(condition);
    if (condition !== undefined && !sqlCondition) {
      return res.status(400).json({ error: 'Condition must be gte/lte or >=/<=.' });
    }
    const sqlStatus = status === undefined ? null : normalizeStatus(status);
    if (status !== undefined && !sqlStatus) {
      return res.status(400).json({ error: 'Status must be Active or Inactive.' });
    }
    if (region_code !== undefined && String(region_code).trim().toUpperCase() !== REGION_CODE) {
      return res.status(400).json({ error: 'Only Region IX alerts are supported at this stage.' });
    }

    const check = await pool.query(
      'SELECT user_id FROM public.price_alerts WHERE alert_id = $1', [id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Alert not found' });
    if (Number(check.rows[0].user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE public.price_alerts
       SET produce_name = COALESCE($1, produce_name),
           target_price = COALESCE($2, target_price),
           condition = COALESCE($3, condition),
           unit = COALESCE($4, unit),
           status = COALESCE($5, status),
           region_code = COALESCE($6, region_code),
           updated_at = NOW()
       WHERE alert_id = $7 AND user_id = $8
       RETURNING *`,
      [produce_name === undefined ? null : produce_name.trim(),
       target_price === undefined ? null : Number(target_price),
       sqlCondition,
       unit === undefined ? null : unit.trim(),
       sqlStatus,
       region_code === undefined ? null : REGION_CODE,
       id, req.user.id]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Update alert error:', error.message);
    return res.status(500).json({ error: 'Failed to update alert' });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const id = parseAlertId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid alert ID' });
    const check = await pool.query(
      'SELECT user_id FROM public.price_alerts WHERE alert_id = $1', [id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Alert not found' });
    if (Number(check.rows[0].user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await pool.query(
      'DELETE FROM public.price_alerts WHERE alert_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    return res.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Delete alert error:', error.message);
    return res.status(500).json({ error: 'Failed to delete alert' });
  }
};
