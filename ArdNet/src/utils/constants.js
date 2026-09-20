export const ROLES = { FARMER: 'farmer', BUYER: 'buyer', ADMIN: 'admin' };

export const PHILIPPINES_PRODUCE_CATEGORIES = [
  'Rice', 'Corn', 'Coconut', 'Banana', 'Mango',
  'Cacao', 'Coffee', 'Cassava', 'Sweet Potato', 'Tomato',
];

export const PRODUCE_CATEGORY_GROUPS = [
  { label: 'Grains & staples', items: ['Rice', 'Corn'] },
  { label: 'Fruits', items: ['Banana', 'Coconut', 'Mango'] },
  { label: 'Root crops', items: ['Cassava', 'Sweet Potato'] },
  { label: 'High-value crops', items: ['Cacao', 'Coffee'] },
  { label: 'Vegetables', items: ['Tomato'] },
];

export function categorySlug(category) {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export function categoryLabel(category) {
  return PHILIPPINES_PRODUCE_CATEGORIES.find((item) => categorySlug(item) === category)
    || category.replace(/-/g, ' ');
}

export const ZAMBOANGA_DEL_SUR_LOCATIONS = [
  'Pagadian', 'Santiago', 'Kumalarang', 'Mahinog', 'Labangan',
  'Dimataling', 'Dumingag', 'Mahayag', 'Molave', 'Ramon Magsaysay',
  'San Miguel', 'Tambulig', 'Tukuran', 'Aurora', 'Bayog',
];

const PRODUCE_IMAGES = {
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
  Corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80',
  Coconut: 'https://images.unsplash.com/photo-1588413335653-34b770bca7c1?auto=format&fit=crop&w=900&q=80',
  Banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80',
  Mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80',
  Cacao: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80',
  Coffee: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
  Cassava: 'https://images.unsplash.com/photo-1764143914716-3524db64940e?auto=format&fit=crop&w=900&q=80',
 'Sweet Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80',
  Tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80',
};

export const DEMO_PRODUCE = PHILIPPINES_PRODUCE_CATEGORIES.map((produce, index) => ({
  id: index + 1,
  produce,
  category: categorySlug(produce),
  location: ZAMBOANGA_DEL_SUR_LOCATIONS[index % ZAMBOANGA_DEL_SUR_LOCATIONS.length],
  quantity: 10 + index * 5,
  unit: produce === 'Coconut' ? 'piece' : 'kg',
  price: [42, 31.5, 18, 28, 64, 180, 220, 35, 48, 95][index],
  image: PRODUCE_IMAGES[produce],
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
