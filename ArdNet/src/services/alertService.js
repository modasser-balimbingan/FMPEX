import { apiRequest } from './apiClient';

export function createPriceAlert(payload) {
  return apiRequest('/alerts', { method: 'POST', body: JSON.stringify(payload) });
}
