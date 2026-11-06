// Small helper functions used across the app.
const AVATAR_COLORS = ['#0f8b8d', '#13294b', '#e8a33d', '#c1495a', '#5b6fb0', '#2e9e6c', '#a25bc4', '#b84c1a', '#3a5ba8'];

export function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

const asDate = (d) => new Date(d + 'T00:00:00');

export function monthKey(d) {
  return asDate(d).toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function monthSortVal(d) {
  const dt = asDate(d);
  return dt.getFullYear() * 12 + dt.getMonth();
}

export function fmtDate(d) {
  return asDate(d).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso) {
  return new Date(iso).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysAgo(d) {
  return Math.floor((Date.now() - asDate(d).getTime()) / 864e5);
}

export function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
