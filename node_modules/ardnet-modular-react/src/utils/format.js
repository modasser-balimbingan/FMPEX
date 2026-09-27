export function peso(value) {
  return `₱${Number(value).toFixed(2)}`;
}

export function titleCase(value = '') {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
