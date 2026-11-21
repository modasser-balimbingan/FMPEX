// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_TIMEOUT = 10000; // 10 seconds

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  ENDPOINTS: {
    AUTH: '/api/auth',
    MARKET: '/api/market-prices',
    ALERTS: '/api/alerts',
    NOTIFICATIONS: '/api/notifications',
    WEATHER: '/api/weather',
    ROLES: '/api/roles',
  },
};

export default API_CONFIG;
