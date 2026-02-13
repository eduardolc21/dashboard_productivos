const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

export function formatPct(pct) {
  return `${Math.round(pct * 100)}%`;
}

export function formatMonth(mk) {
  const [y, m] = mk.split('-');
  return `${MESES[parseInt(m, 10) - 1]} ${y}`;
}
