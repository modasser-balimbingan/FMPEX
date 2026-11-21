
import API_CONFIG from './config';

/**
 * Core API client with request/response handling,
 * auth tokens, and error management.
 */
class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.tokenKey = 'ardnet.token';
    this.refreshTokenKey = 'refreshToken';
  }

  /**
   * Normalize accidental whitespace, Bearer prefixes,
   * or matching surrounding quotes.
   *
   * This does not repair an invalid JWT.
   */
  normalizeToken(token) {
    if (typeof token !== 'string') {
      return null;
    }

    let normalized = token.trim();

    normalized = normalized.replace(/^Bearer\s+/i, '');

    if (
      (normalized.startsWith('"') &&
        normalized.endsWith('"')) ||
      (normalized.startsWith("'") &&
        normalized.endsWith("'"))
    ) {
      normalized = normalized.slice(1, -1).trim();
    }

    return normalized || null;
  }

  /**
   * Get stored auth token from this tab's sessionStorage.
   */
  getToken() {
    const storedToken = sessionStorage.getItem(this.tokenKey);

    if (!storedToken) {
      return null;
    }

    const token = this.normalizeToken(storedToken);

    if (!token) {
      sessionStorage.removeItem(this.tokenKey);
      return null;
    }

    // Persist normalization if necessary.
    if (token !== storedToken) {
      sessionStorage.setItem(this.tokenKey, token);
    }

    return token;
  }

  /**
   * Set auth token in this tab's sessionStorage.
   */
  setToken(token) {
    const normalized = this.normalizeToken(token);

    if (normalized) {
      sessionStorage.setItem(this.tokenKey, normalized);
    } else {
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  /**
   * Get stored refresh token from this tab's sessionStorage.
   */
  getRefreshToken() {
    return sessionStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Set refresh token in this tab's sessionStorage.
   */
  setRefreshToken(token) {
    if (typeof token === 'string' && token.trim()) {
      sessionStorage.setItem(
        this.refreshTokenKey,
        token.trim()
      );
    } else {
      sessionStorage.removeItem(this.refreshTokenKey);
    }
  }

  /**
   * Clear all auth tokens.
   */
  clearTokens() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Build request headers with the current auth token.
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API errors with standardized format.
   */
  handleError(error, endpoint) {
    console.error(`API Error [${endpoint}]:`, error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        status: 0,
      };
    }

    return {
      success: false,
      error: error.message || 'An error occurred',
      status: error.status || 500,
    };
  }

  /**
   * Make HTTP request with timeout.
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      timeout = this.timeout,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const abortController = new AbortController();

    const timeoutId = setTimeout(
      () => abortController.abort(),
      timeout
    );

    try {
      const config = {
        method,
        headers: this.getHeaders(headers),
        signal: abortController.signal,
      };

      if (body !== null && body !== undefined) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);

      // Handle empty response.
      if (response.status === 204) {
        return {
          success: true,
          data: null,
          status: 204,
        };
      }

      // Read the response safely.
      const contentType =
        response.headers.get('content-type') || '';

      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Only expire the session when the backend says the access token
      // itself is invalid. Other 401 responses (for example, an incorrect
      // current password) must not log the user out.
      if (response.status === 401) {
        const authorization = config.headers.Authorization;
        const sentToken = this.normalizeToken(
          typeof authorization === 'string' ? authorization : ''
        );
        const currentToken = this.getToken();
        const message = String(data?.error || data?.message || '');

        const isTokenFailure =
          /access token required|malformed access token|invalid or expired token|token expired|user not found/i.test(message);

        if (
          isTokenFailure &&
          sentToken &&
          currentToken === sentToken
        ) {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        } else if (sentToken && currentToken !== sentToken) {
          console.warn(`Ignored stale 401 response for ${endpoint}`);
        }
      }

      if (response.status === 403 && data?.code === 'ACCOUNT_SUSPENDED' &&
          this.normalizeToken(config.headers.Authorization) === this.getToken()) {
        window.dispatchEvent(new CustomEvent('auth:suspended'));
      }

      // Handle unsuccessful HTTP responses.
      if (!response.ok) {
        return {
          success: false,
          error:
            data?.error ||
            data?.message ||
            'Request failed',
          status: response.status,
          data,
        };
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          status: 0,
        };
      }

      return this.handleError(error, endpoint);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request.
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request.
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  /**
   * PUT request.
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body,
      ...options,
    });
  }

  /**
   * PATCH request.
   */
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body,
      ...options,
    });
  }

  /**
   * DELETE request.
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Export singleton instance.
export const apiClient = new APIClient();
export default apiClient;
