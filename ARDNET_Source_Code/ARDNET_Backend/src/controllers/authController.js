const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
// Import the Brevo service
const { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerificationEmail } = require('../services/brevoService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || JWT_SECRET;
const EMAIL_VERIFICATION_SECRET = process.env.EMAIL_VERIFICATION_SECRET || JWT_SECRET;
const EMAIL_VERIFICATION_EXPIRY = '24h';
const PASSWORD_RESET_EXPIRY = '20m';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

// ★ CHANGED: Shared role conversion map.
// Database role names → frontend role names
const frontendRoleMap = {
  'Farmer': 'farmer',
  'Buyer/Vendor': 'buyer',
  'Administrator': 'admin'
};


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields first
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        error: 'Name, email, password, and role are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Normalize email before validating or querying the database
    const normalizedEmail = email.trim().toLowerCase();

    // Allow Gmail, Yahoo, Outlook, and Hotmail
    const emailPattern =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        error:
          'Please use a valid email address.'
      });
    }

    // Convert frontend role to database role
    // Administrator accounts must be provisioned by an authorized
    // administrator/database operator, never through public registration.
    const roleMap = {
      farmer: 'Farmer',
      buyer: 'Buyer/Vendor'
    };

    const databaseRole = roleMap[role];

    if (!databaseRole) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    // Find the role ID
    const roleResult = await pool.query(
      'SELECT role_id FROM roles WHERE role_name = $1',
      [databaseRole]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Role not found in database'
      });
    }

    const role_id = roleResult.rows[0].role_id;

    // Check for an existing email — only declare existingUser once
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'This email address is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split full name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Insert user into PostgreSQL
    const result = await pool.query(
      `INSERT INTO users
        (role_id, user_name, email, password_hash, first_name, last_name,
         email_verified, status, created_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING user_id, user_name, email, role_id, status`,
      [
        role_id,
        name.trim(),
        normalizedEmail,
        hashedPassword,
        firstName,
        lastName,
        false,
        'active'
      ]
    );

    const user = result.rows[0];

    // Registration creates an inactive-for-login account until the owner proves
    // access to the supplied email address. The database status remains active;
    // email_verified is the separate verification gate.
    const verificationToken = jwt.sign(
      {
        sub: String(user.user_id),
        email: user.email,
        purpose: 'email-verification'
      },
      EMAIL_VERIFICATION_SECRET,
      { expiresIn: EMAIL_VERIFICATION_EXPIRY }
    );
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    try {
      await sendEmailVerificationEmail(user.email, firstName, verificationUrl);
    } catch (emailError) {
      console.error(
        'Email verification delivery failed:',
        emailError.response?.body || emailError.message
      );
      // Keep the account so the user can request another verification email.
    }

    return res.status(201).json({
      message: 'Account created. Check your email for a verification link before signing in.',
      email: user.email,
      verificationEmailSent: true
    });
  } catch (error) {
    // Handle a duplicate email if two requests arrive simultaneously.
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This email address is already registered'
      });
    }

    console.error('Register error:', error);

    return res.status(500).json({
      error: 'Failed to register user'
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Suspended accounts must not be able to obtain a fresh session.
    if (String(user.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({
        error: 'Your account is suspended or inactive. Please contact the administrator.'
      });
    }

    if (user.email_verified !== true) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        error: 'Please verify your email address before signing in.'
      });
    }

    // Get role name from database
    const roleResult = await pool.query(
      'SELECT role_name FROM roles WHERE role_id = $1',
      [user.role_id]
    );

    const roleName = roleResult.rows[0].role_name;

    // ★ CHANGED: Convert database role to frontend role
    const frontendRole = frontendRoleMap[roleName];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        role: frontendRole
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY
      }
    );

    // Send login response
    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.email,

        // ★ CHANGED: Send "farmer", not "Farmer"
        role: frontendRole
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login'
    });
  }
};


// Verify ownership of the email address using a signed, purpose-bound token.
exports.verifyEmail = async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, EMAIL_VERIFICATION_SECRET, { algorithms: ['HS256'] });
    } catch (_tokenError) {
      return res.status(400).json({ error: 'This verification link is invalid or has expired. Request a new email to continue.' });
    }

    if (payload.purpose !== 'email-verification' || !payload.sub || !payload.email) {
      return res.status(400).json({ error: 'This verification link is invalid or has expired. Request a new email to continue.' });
    }

    // Only send the welcome email on the first successful verification. A
    // repeated request (for example, React StrictMode) can still establish a session.
    const updated = await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           updated_at = NOW()
       WHERE user_id = $1
         AND LOWER(email) = LOWER($2)
         AND email_verified = FALSE
       RETURNING user_id, email, user_name, role_id, email_verified, status`,
      [payload.sub, payload.email]
    );

    let user = updated.rows[0];
    const newlyVerified = Boolean(user);

    if (!user) {
      const existing = await pool.query(
        `SELECT user_id, email, user_name, role_id, email_verified, status
         FROM users
         WHERE user_id = $1 AND LOWER(email) = LOWER($2)
         LIMIT 1`,
        [payload.sub, payload.email]
      );
      user = existing.rows[0];
    }

    if (!user || user.email_verified !== true) {
      return res.status(400).json({ error: 'This verification link is invalid or no longer applies to this account.' });
    }

    if (String(user.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact the administrator.' });
    }

    const roleResult = await pool.query(
      'SELECT role_name FROM roles WHERE role_id = $1',
      [user.role_id]
    );
    const roleName = roleResult.rows[0]?.role_name;
    const frontendRole = frontendRoleMap[roleName];

    if (!frontendRole) {
      return res.status(500).json({ error: 'Unable to determine the account role.' });
    }

    if (newlyVerified) {
      const firstName = String(user.user_name || '').trim().split(/\s+/)[0] || 'there';
      try {
        await sendWelcomeEmail(user.email, firstName);
      } catch (emailError) {
        console.error('Welcome email failed after verification:', emailError.response?.body || emailError.message);
      }
    }

    // Create the same application session shape as /login so the frontend can
    // dispatch loginSuccess immediately after verification.
    const sessionToken = jwt.sign(
      { id: user.user_id, email: user.email, role: frontendRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.json({
      message: 'Email verified successfully. Signing you in…',
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.email,
        role: frontendRole
      },
      token: sessionToken
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Unable to verify this email right now. Please try again.' });
  }
};

// Resend verification without revealing whether an account exists.
exports.resendEmailVerification = async (req, res) => {
  const genericMessage = 'If an unverified account exists for that email, a verification link will be sent shortly.';
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.json({ message: genericMessage });
    }

    const result = await pool.query(
      `SELECT user_id, email, user_name, email_verified, status
       FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );
    const user = result.rows[0];
    if (user && user.email_verified !== true && String(user.status || '').toLowerCase() === 'active') {
      const token = jwt.sign(
        { sub: String(user.user_id), email: user.email, purpose: 'email-verification' },
        EMAIL_VERIFICATION_SECRET,
        { expiresIn: EMAIL_VERIFICATION_EXPIRY }
      );
      const url = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
      const firstName = String(user.user_name || '').trim().split(/\s+/)[0] || 'there';
      try {
        await sendEmailVerificationEmail(user.email, firstName, url);
      } catch (emailError) {
        console.error('Resend verification email failed:', emailError.response?.body || emailError.message);
      }
    }
    return res.json({ message: genericMessage });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.json({ message: genericMessage });
  }
};

// Password recovery: always return the same public response so callers cannot
// discover whether an email address has an account.
exports.forgotPassword = async (req, res) => {
  const genericMessage =
    'If an account exists for that email address, a password reset link will be sent shortly.';

  try {
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    // Keep response behavior generic even for invalid or unknown addresses.
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(200).json({ message: genericMessage });
    }

    const result = await pool.query(
      `SELECT user_id, email, user_name, password_hash, status
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // Do not issue recovery links to suspended/inactive accounts.
      if (String(user.status || '').toLowerCase() === 'active') {
        const passwordVersion = crypto
          .createHash('sha256')
          .update(user.password_hash)
          .digest('hex');

        const resetToken = jwt.sign(
          {
            sub: String(user.user_id),
            purpose: 'password-reset',
            passwordVersion,
          },
          PASSWORD_RESET_SECRET,
          { expiresIn: PASSWORD_RESET_EXPIRY, jwtid: crypto.randomUUID() }
        );

        const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
        const firstName = String(user.user_name || '').trim().split(/\s+/)[0] || 'there';

        try {
          await sendPasswordResetEmail(user.email, firstName, resetUrl);
        } catch (emailError) {
          // Do not reveal delivery/account state in the HTTP response.
          console.error(
            'Password reset email failed:',
            emailError.response?.body || emailError.message
          );
        }
      }
    }

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Keep the public response generic on internal errors as well.
    return res.status(200).json({ message: genericMessage });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (
      typeof token !== 'string' || !token.trim() ||
      typeof newPassword !== 'string' || !newPassword ||
      typeof confirmPassword !== 'string' || !confirmPassword
    ) {
      return res.status(400).json({ error: 'Reset token, new password, and confirmation are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirmation do not match.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, PASSWORD_RESET_SECRET, { algorithms: ['HS256'] });
    } catch (_tokenError) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Please request a new one.' });
    }

    if (payload.purpose !== 'password-reset' || !payload.sub || !payload.passwordVersion) {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Please request a new one.' });
    }

    const userResult = await pool.query(
      `SELECT user_id, password_hash, status
       FROM users
       WHERE user_id = $1
       LIMIT 1`,
      [payload.sub]
    );

    if (userResult.rows.length === 0 || String(userResult.rows[0].status || '').toLowerCase() !== 'active') {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired. Please request a new one.' });
    }

    const user = userResult.rows[0];
    const currentPasswordVersion = crypto
      .createHash('sha256')
      .update(user.password_hash)
      .digest('hex');

    // The reset link becomes unusable after a successful password change,
    // without adding a new database table or changing the approved schema.
    if (currentPasswordVersion !== payload.passwordVersion) {
      return res.status(400).json({ error: 'This password reset link has already been used or is no longer valid. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateResult = await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE user_id = $2
         AND password_hash = $3
       RETURNING user_id`,
      [hashedPassword, user.user_id, user.password_hash]
    );

    if (updateResult.rows.length === 0) {
      return res.status(400).json({ error: 'This password reset link has already been used or is no longer valid. Please request a new one.' });
    }

    return res.json({ message: 'Your password has been reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Unable to reset your password right now. Please try again.' });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, user_name, email, role_id, created_at FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Get role name
    const roleResult = await pool.query(
      'SELECT role_name FROM roles WHERE role_id = $1',
      [user.role_id]
    );

    const roleName = roleResult.rows[0].role_name;

    res.json({
      id: user.user_id,
      name: user.user_name,
      email: user.email,

      // ★ CHANGED: Convert database role to frontend role
      role: frontendRoleMap[roleName] || roleName,

      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile'
    });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate required profile fields
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const nameParts = normalizedName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Basic email format validation
    const emailPattern =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/i;

if (!emailPattern.test(normalizedEmail)) {
  return res.status(400).json({
    error:
      'Please use a valid Gmail, Yahoo, Outlook, or Hotmail email address.'
  });
}

    const result = await pool.query(
  `UPDATE users
   SET user_name = $1,
       first_name = $2,
       last_name = $3,
       email = $4,
       updated_at = NOW()
   WHERE user_id = $5
   RETURNING user_id, user_name, email, role_id`,
  [
    normalizedName,
    firstName,
    lastName,
    normalizedEmail,
    req.user.id
  ]
);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    const roleResult = await pool.query(
      'SELECT role_name FROM roles WHERE role_id = $1',
      [user.role_id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        error: 'User role not found'
      });
    }

    const roleName = roleResult.rows[0].role_name;

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.email,
        role: frontendRoleMap[roleName] || roleName
      }
    });

  } catch (error) {
    // PostgreSQL unique-constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This email address is already registered'
      });
    }

    console.error('Update profile error:', error);

    return res.status(500).json({
      error: 'Failed to update profile'
    });
  }
};

// Change password controller
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (
      typeof currentPassword !== 'string' ||
      !currentPassword ||
      typeof newPassword !== 'string' ||
      !newPassword ||
      typeof confirmPassword !== 'string' ||
      !confirmPassword
    ) {
      return res.status(400).json({
        error: 'All password fields are required'
      });
    }

    // Require at least 8 characters
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // Check that the new password and confirmation match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'New password and confirmation do not match'
      });
    }

    // Prevent changing to the same password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from your current password'
      });
    }

    // Get the authenticated user's stored password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify the current password
    const validPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [hashedPassword, req.user.id]
    );

    return res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);

    return res.status(500).json({
      error: 'Failed to change password'
    });
  }
};
