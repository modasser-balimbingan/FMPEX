
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next, allowSuspended = false) => {
  try {
    const authHeader = req.headers.authorization;

    // Check for the Bearer authorization scheme.
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    // Extract the token and remove surrounding whitespace.
    const rawToken = authHeader.replace(/^Bearer\s+/i, '');
    const token = rawToken.trim();

    const sections = token.split('.');

    // Reject obviously malformed JWTs before verification.
    if (
      sections.length !== 3 ||
      sections.some(section => section.length === 0)
    ) {
      return res.status(401).json({
        error: 'Malformed access token'
      });
    }

    // Verify the token using the configured JWT secret.
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Find the authenticated user in PostgreSQL.
    const result = await pool.query(
      'SELECT status FROM public.users WHERE user_id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Ensure the account is active.
    const accountStatus = String(result.rows[0].status).toLowerCase();
    if (accountStatus !== 'active' && !(allowSuspended && accountStatus === 'suspended')) {
      return res.status(403).json({
        code: accountStatus === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_INACTIVE',
        error: accountStatus === 'suspended' ? 'Your account is suspended. You can still read your notifications.' : 'Account is inactive'
      });
    }

    // Make the verified token payload available to protected routes.
    req.user = decoded;
    req.accountStatus = accountStatus;

    return next();
  } catch (error) {
    console.error(
      'JWT verification failed:',
      error.name,
      error.message
    );

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    console.error('Authentication middleware error:', error);

    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

const requireRole = (...roles) => {
  // Accept either requireRole('admin') or requireRole(['admin']) so
  // existing route declarations cannot accidentally deny every admin.
  const allowedRoles = roles
    .flat(Infinity)
    .filter((role) => typeof role === 'string' && role.trim())
    .map((role) => role.trim());

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    return next();
  };
};

module.exports = {
  verifyToken,
  verifyTokenForNotifications: (req, res, next) => verifyToken(req, res, next, true),
  requireRole
};
