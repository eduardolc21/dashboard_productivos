import { useState, useEffect } from 'react';
import { loadDashboardData } from './lib/data.js';
import { formatMonth } from './lib/format.js';
import KPICards from './components/KPICards.jsx';
import PerformanceChart from './components/PerformanceChart.jsx';
import ProductionTable from './components/ProductionTable.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData().then(setData).catch(setError);
  }, []);

  if (error) {
    return <div className="state-message error">Error: {error.message}</div>;
  }
  if (!data) {
    return <div className="state-message">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Productividad</h1>
        <p className="subtitle">
          {formatMonth(data.currentMonth)} &middot; Generado: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </header>

      <KPICards current={data.current} />
      <PerformanceChart series={data.series} />
      <ProductionTable tecnicos={data.current.tecnicos} />
    </div>
  );
}
