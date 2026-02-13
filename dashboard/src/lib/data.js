export async function loadDashboardData() {
  const res = await fetch('./data.json');
  if (!res.ok) throw new Error(`Error cargando datos: ${res.status}`);
  return res.json();
}
