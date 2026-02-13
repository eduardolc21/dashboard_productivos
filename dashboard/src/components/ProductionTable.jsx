import { formatPct } from '../lib/format.js';

export default function ProductionTable({ tecnicos, metaMensual }) {
  return (
    <div className="table-container">
      <h2>Detalle de Produccion</h2>
      <table>
        <thead>
          <tr>
            <th>Tecnico</th>
            <th>Realizado</th>
            <th>Meta</th>
            <th>Balance</th>
            <th>% Cumplimiento</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {tecnicos.map(t => (
            <tr key={t.tecnico}>
              <td><strong>{t.tecnico}</strong></td>
              <td>{t.realizado}</td>
              <td>{metaMensual}</td>
              <td style={{ color: t.balance >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                {t.balance >= 0 ? '+' : ''}{t.balance}
              </td>
              <td>{formatPct(t.pct)}</td>
              <td>
                <span className={`badge ${t.estado === 'PAGO OK' ? 'pago-ok' : 'observado'}`}>
                  {t.estado}
                </span>
              </td>
              <td>{t.accion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
