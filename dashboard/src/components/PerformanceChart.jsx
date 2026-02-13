import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { formatMonth } from '../lib/format.js';

const COLORS = {
  MARIA: '#1a73e8',
  ANDER: '#34a853',
  CRISTHIAN: '#ea4335',
};

export default function PerformanceChart({ series, metaMensual }) {
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
          <Tooltip />
          <Legend />
          <ReferenceLine
            y={metaMensual}
            stroke="#ff7300"
            strokeDasharray="5 5"
            label={{ value: 'Meta 120', position: 'right', fontSize: 12 }}
          />
          {Object.entries(COLORS).map(([key, color]) => (
            <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
