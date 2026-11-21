
import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Authentication service - handles login, registration,
 * profile management, and logout.
 */

const storeAuthTokens = (data, label) => {
  if (!data || typeof data.token !== 'string' || !data.token.trim()) {
    console.error(`${label}: Missing or invalid token in response.`);
    return false;
  }

  const token = data.token.trim();

  // A standard JWT must contain three sections.
  if (token.split('.').length !== 3) {
    console.error(`${label}: Token is not in standard JWT format.`);
    return false;
  }

  apiClient.setToken(token);

  if (data.refreshToken) {
    apiClient.setRefreshToken(data.refreshToken);
  }

  return true;
};

export const authService = {
  /**
   * Register a new user.
   */
  async register(userData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH}/register`;
    const response = await apiClient.post(endpoint, userData);

    if (response.success && response.data?.token) {
      storeAuthTokens(response.data, 'Register');
    }

    return response;
  },

  /**
   * Log in an existing user.
   */
  async login(credentials) {
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH}/login`;
    const response = await apiClient.post(endpoint, credentials);

    if (response.success) {
      const stored = storeAuthTokens(response.data, 'Login');

      if (!stored) {
        console.error(
          'Login succeeded, but the returned token could not be stored.'
        );
      }
    }

    return response;
  },

  /**
   * Get the current user's profile.
   */
  async getProfile() {
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH}/profile`;
    return apiClient.get(endpoint);
  },

  /**
   * Update the current user's profile.
   */
  async updateProfile(profileData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.AUTH}/profile`;
    return apiClient.put(endpoint, profileData);
  },

  /**
   * Log out and clear stored tokens.
   */
  logout() {
    apiClient.clearTokens();
    return { success: true, data: null };
  },

  /**
   * Check whether a token is stored.
   */
  isAuthenticated() {
    return Boolean(apiClient.getToken());
  },

  /**
   * Get the stored access token.
   */
  getToken() {
    return apiClient.getToken();
  },
};

export default authService;
