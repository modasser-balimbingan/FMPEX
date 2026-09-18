import { DEMO_PRICES, DEMO_WEATHER } from '../utils/constants';
import { apiRequest } from './apiClient';

export async function getMarketPrices() {
  try {
    return await apiRequest('/market-prices');
  } catch {
    return DEMO_PRICES;
  }
}

export async function getWeather() {
  try {
    return await apiRequest('/weather');
  } catch {
    return DEMO_WEATHER;
  }
}
