import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatMonth } from '../lib/format.js';

const COLORS = {
  MARIA: '#1a73e8',
  ANDER: '#34a853',
  CRISTHIAN: '#ea4335',
};

const TECNICO_KEYS = Object.keys(COLORS);

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {TECNICO_KEYS.map(t => {
        const realizado = data[t] ?? 0;
        const meta = data['meta_' + t] ?? 0;
        const cumple = meta > 0 && realizado >= meta;
        return (
          <div key={t} className="chart-tooltip-row">
            <span className="chart-tooltip-name" style={{ color: COLORS[t] }}>{t}</span>
            <span className="chart-tooltip-values">{realizado} / {meta}</span>
            <span className={`chart-tooltip-badge ${cumple ? 'ok' : 'fail'}`}>
              {cumple ? 'CUMPLIO' : 'NO CUMPLIO'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PerformanceChart({ series }) {
  if (!series || series.length === 0) {
    return (
      <div className="chart-container">
        <h2>Rendimiento por Tecnico</h2>
        <p style={{ color: 'var(--text-secondary)', padding: 20 }}>
          Sin datos historicos disponibles.
        </p>
      </div>
    );
  }

  const chartData = series.map(s => ({
    ...s,
    name: formatMonth(s.month),
  }));

  return (
    <div className="chart-container">
      <h2>Rendimiento por Tecnico</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {Object.entries(COLORS).map(([key, color]) => (
            <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
