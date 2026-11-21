const normalize = text => text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

// Older records may already contain the province in their location text.
export function marketLocationLabel({ location, province }) {
  const parts = String(location || '').split(',').map(part => part.trim()).filter(Boolean);
  const seen = new Set();
  const unique = parts.filter(part => { const key = normalize(part); if (seen.has(key)) return false; seen.add(key); return true; });
  const provinceLabel = String(province || '').trim();
  if (provinceLabel && !seen.has(normalize(provinceLabel))) {
    const countryIndex = unique.findIndex(part => normalize(part) === 'philippines');
    unique.splice(countryIndex === -1 ? unique.length : countryIndex, 0, provinceLabel);
  }
  return unique.join(', ') || 'Location not provided';
}

const dateFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
export function marketDateLabel(value) {
  if (!value) return '—';
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}
