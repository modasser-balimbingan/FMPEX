import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Market Prices service - handles market data operations
 */
export const marketService = {
  /**
   * Get all market prices
   */
  async getPrices(filters = {}) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}`;
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    return apiClient.get(url);
  },

  /**
   * Get market price by ID
   */
  async getPriceById(id) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}/${id}`;
    return apiClient.get(endpoint);
  },

  /**
   * Create new market price entry (admin only)
   */
  async createPrice(priceData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}`;
    return apiClient.post(endpoint, priceData);
  },

  /**
   * Update market price (admin only)
   */
  async updatePrice(id, priceData) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}/${id}`;
    return apiClient.put(endpoint, priceData);
  },

  /**
   * Delete market price (admin only)
   */
  async deletePrice(id) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}/${id}`;
    return apiClient.delete(endpoint);
  },

  /**
   * Get market trends/analytics
   */
  async getTrends(filters = {}) {
    const endpoint = `${API_CONFIG.ENDPOINTS.MARKET}/trends`;
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    return apiClient.get(url);
  },
};

export default marketService;
