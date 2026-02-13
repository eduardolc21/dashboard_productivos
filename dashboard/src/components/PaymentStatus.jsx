import { formatPct } from '../lib/format.js';

export default function PaymentStatus({ tecnicos }) {
  return (
    <div className="payment-grid">
      {tecnicos.map(t => (
        <div
          key={t.tecnico}
          className={`payment-card ${t.estado === 'PAGO OK' ? 'ok' : 'observado'}`}
        >
          <div className="tech-name">{t.tecnico}</div>
          <div className="stats">
            <span>Realizado: <strong>{t.realizado}</strong></span>
            <span>Meta: <strong>{t.meta}</strong></span>
            <span>Balance: <strong>{t.balance >= 0 ? '+' : ''}{t.balance}</strong></span>
          </div>
          <div className="progress-bar">
            <div
              className={`fill ${t.pct >= 1 ? 'success' : 'warning'}`}
              style={{ width: `${Math.min(t.pct * 100, 100)}%` }}
            />
          </div>
          <div className="footer">
            <span className={`badge ${t.estado === 'PAGO OK' ? 'pago-ok' : 'observado'}`}>
              {t.estado}
            </span>
            <span className="accion">{t.accion}</span>
          </div>
          <div className="pct-label" style={{ textAlign: 'right', marginTop: 4 }}>
            {formatPct(t.pct)}
          </div>
        </div>
      ))}
    </div>
  );
}
