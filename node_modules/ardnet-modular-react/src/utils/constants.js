export const ROLES = { FARMER: 'farmer', BUYER: 'buyer', ADMIN: 'admin' };

export const PHILIPPINES_PRODUCE_CATEGORIES = [
  'Rice', 'Corn', 'Coconut', 'Banana', 'Mango',
  'Cacao', 'Coffee', 'Cassava', 'Sweet Potato', 'Tomato',
];

export const ZAMBOANGA_DEL_SUR_LOCATIONS = [
  'Pagadian', 'Santiago', 'Kumalarang', 'Mahinog', 'Labangan',
  'Dimataling', 'Dumingag', 'Mahayag', 'Molave', 'Ramon Magsaysay',
  'San Miguel', 'Tambulig', 'Tukuran', 'Aurora', 'Bayog',
];

export const DEMO_PRODUCE = PHILIPPINES_PRODUCE_CATEGORIES.map((produce, index) => ({
  id: index + 1,
  produce,
  category: produce.toLowerCase().replace(' ', '-'),
  location: ZAMBOANGA_DEL_SUR_LOCATIONS[index % ZAMBOANGA_DEL_SUR_LOCATIONS.length],
  quantity: 10 + index * 5,
  unit: produce === 'Coconut' ? 'piece' : 'kg',
  price: [42, 31.5, 18, 28, 64, 180, 220, 35, 48, 95][index],
  farmerEmail: ['juan@example.com', 'maria@example.com', 'abdul@example.com', 'fatima@example.com'][index % 4],
  farmerContact: ['09171234567', '09181234567', '09191234567', '09201234567'][index % 4],
}));

export const DEMO_ADMIN = {
  name: 'ArdNet Administrator',
  email: 'admin@ardnet.ph',
  password: 'Admin@123',
  role: ROLES.ADMIN,
};

export const DEMO_PRICES = [
  { produce: 'Rice', location: 'Pagadian', price: 42, unit: 'kg', date: '2026-09-16', source: 'Market Reference', trend: 6.3 },
  { produce: 'Corn', location: 'Santiago', price: 31.5, unit: 'kg', date: '2026-09-16', source: 'Market Reference', trend: 2.1 },
  { produce: 'Coconut', location: 'Kumalarang', price: 18, unit: 'piece', date: '2026-09-16', source: 'Market Reference', trend: -1.4 },
  { produce: 'Banana', location: 'Mahinog', price: 28, unit: 'kg', date: '2026-09-16', source: 'Market Reference', trend: 3.7 },
];

export const DEMO_WEATHER = {
  temperature: 28,
  condition: 'Partly cloudy',
  location: 'Pagadian City, Zamboanga del Sur',
  forecast: [['Today', '28° / 24°'], ['Tomorrow', '29° / 24°'], ['Friday', '27° / 23°'], ['Saturday', '28° / 24°']],
};
