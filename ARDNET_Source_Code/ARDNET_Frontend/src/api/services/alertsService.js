import apiClient from '../apiClient';
import API_CONFIG from '../config';

// Matches the routes in ARDNET_Backend/src/routes/alerts.js.
export const alertsService = {
  getAlerts() {
    return apiClient.get(API_CONFIG.ENDPOINTS.ALERTS);
  },
  createAlert(alertData) {
    return apiClient.post(API_CONFIG.ENDPOINTS.ALERTS, alertData);
  },
  updateAlert(id, alertData) {
    return apiClient.put(`${API_CONFIG.ENDPOINTS.ALERTS}/${id}`, alertData);
  },
  deleteAlert(id) {
    return apiClient.delete(`${API_CONFIG.ENDPOINTS.ALERTS}/${id}`);
  },
  enableAlert(id) {
    return this.updateAlert(id, { status: 'Active' });
  },
  disableAlert(id) {
    return this.updateAlert(id, { status: 'Inactive' });
  },
};

export default alertsService;
