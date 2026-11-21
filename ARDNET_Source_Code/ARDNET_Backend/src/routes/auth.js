
const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Lightweight per-process rate limits for public recovery endpoints. In production,
// use a shared store/reverse-proxy limit if the API runs across multiple instances.
const recoveryAttempts = new Map();
function limitRecoveryRequests({ windowMs, max, genericOnLimit = false, genericMessage = 'If an account exists for that email address, a password reset link will be sent shortly.' }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = recoveryAttempts.get(key);
    const bucket = !current || now - current.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : current;
    bucket.count += 1;
    recoveryAttempts.set(key, bucket);

    if (bucket.count > max) {
      if (genericOnLimit) {
        return res.status(200).json({ message: genericMessage });
      }
      return res.status(429).json({ error: 'Too many password reset attempts. Please wait a little and try again.' });
    }

    // Periodically prune old entries so the map does not grow indefinitely.
    if (recoveryAttempts.size > 1000) {
      for (const [ip, item] of recoveryAttempts) {
        if (now - item.startedAt >= windowMs) recoveryAttempts.delete(ip);
      }
    }
    return next();
  };
}

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post(
  '/resend-verification',
  limitRecoveryRequests({
    windowMs: 15 * 60 * 1000,
    max: 5,
    genericOnLimit: true,
    genericMessage: 'If an unverified account exists for that email, a verification link will be sent shortly.'
  }),
  authController.resendEmailVerification
);
router.post(
  '/forgot-password',
  limitRecoveryRequests({ windowMs: 15 * 60 * 1000, max: 5, genericOnLimit: true }),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  limitRecoveryRequests({ windowMs: 15 * 60 * 1000, max: 10 }),
  authController.resetPassword
);

// Protected endpoints
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);

// Change password
router.put(
  '/change-password',
  verifyToken,
  authController.changePassword
);

module.exports = router;
