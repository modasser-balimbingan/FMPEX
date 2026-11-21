import apiClient from '../apiClient';
import API_CONFIG from '../config';

/**
 * Weather service - handles weather data and forecasts
 */
export const weatherService = {
  /**
   * Get weather data by location
   */
  async getWeatherByLocation(location, filters = {}) {
    const params = { ...filters, location };
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.WEATHER}?${queryParams}`;
    return apiClient.get(endpoint);
  },

  /**
   * Get weather by coordinates
   */
  async getWeatherByCoords(latitude, longitude, filters = {}) {
    const params = { ...filters, latitude, longitude };
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.WEATHER}?${queryParams}`;
    return apiClient.get(endpoint);
  },

  /**
   * Get weather forecast
   */
  async getForecast(location, days = 7) {
    const params = { location, days };
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.WEATHER}/forecast?${queryParams}`;
    return apiClient.get(endpoint);
  },

  /**
   * Get current weather
   */
  async getCurrentWeather(location) {
    const params = { location };
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.WEATHER}/current?${queryParams}`;
    return apiClient.get(endpoint);
  },

  /**
   * Get severe weather alerts
   */
  async getSevereWeatherAlerts(location) {
    const params = { location };
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.WEATHER}/alerts?${queryParams}`;
    return apiClient.get(endpoint);
  },
};

export default weatherService;
