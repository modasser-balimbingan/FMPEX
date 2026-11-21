
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

// Import routes
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const alertsRoutes = require('./routes/alerts');
const weatherRoutes = require('./routes/weather');
const listingsRoutes = require('./routes/listings');
const { sendTestEmail } = require('./services/brevoService');
const auditRoutes = require('./routes/audit');
const adminUsersRoutes = require('./routes/adminUsers');
const notificationsRoutes = require('./routes/notifications');
const { commentsRouter, adminCommentsRouter } = require('./routes/comments');
const favoritesRoutes = require('./routes/favorites');

// Import config
const pool = require('./config/database');
const { startPriceAlertReconciler } = require('./services/priceAlertReconciler');

const app = express();
const PORT = process.env.PORT || 3000;

// Prevent Express from generating ETags that can lead to 304 responses.
app.disable('etag');

// General middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent the authenticated profile endpoint from returning cached responses.
// This middleware must be registered before the auth routes.
app.use('/api/auth/profile', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Serve uploaded produce photos
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'ARDNET Backend is running!',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/market-prices', marketRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/admin/audit-logs', auditRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/comments', commentsRouter);
app.use('/api/admin/comments', adminCommentsRouter);

// ARDNET_SOAP_MARKET_PRICES_ROUTE_V1 — read-only SOAP 1.1, no WSDL
if (String(process.env.SOAP_MARKET_PRICES_ENABLED || '').toLowerCase() === 'true') {
  const { createSoapMarketPricesRouter } = require('./routes/soapMarketPrices');
  app.use('/soap/market-prices', createSoapMarketPricesRouter(pool));
  console.log('[ARDNET SOAP] Read-only market-price service enabled at /soap/market-prices');
}


// Test route
app.post('/api/test', (req, res) => {
  res.json({ message: 'Test POST works' });
});

// Test email route
app.post('/api/test-email', async (req, res) => {
  try {
    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        error: 'recipientEmail is required',
      });
    }

    await sendTestEmail(recipientEmail);

    return res.json({
      message: 'Test email sent successfully through Brevo',
    });
  } catch (error) {
    console.error(
      'Brevo email error:',
      error.response?.body || error.message
    );

    return res.status(500).json({
      error: 'Failed to send test email through Brevo',
    });
  }
});

// Roles endpoint
app.get('/api/roles', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM roles ORDER BY role_id'
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch roles',
    });
  }
});

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        category_id,
        category_name,
        description,
        status
      FROM produce_categories
      WHERE status = 'active'
      ORDER BY category_name
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error.message);

    return res.status(500).json({
      error: 'Failed to fetch produce categories',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  // Optional Region IX recovery loop. Enable only for the intended DB.
  void startPriceAlertReconciler().catch((error) => {
    console.error('[Price alert reconciler] Startup refused:', error.message);
  });
  console.log(`\n✓ ARDNET Backend running on http://localhost:${PORT}`);
  console.log(`✓ API Base: http://localhost:${PORT}/api`);
});
