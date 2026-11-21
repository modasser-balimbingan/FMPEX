import apiClient from '../apiClient';
import API_CONFIG from '../config';

// Matches ARDNET_Backend/src/routes/notifications.js (Phase 2C).
export const notificationsService = {
  getNotifications() {
    return apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
  },
  markAllRead() {
    return apiClient.patch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/read-all`, {});
  },
};

export default notificationsService;
