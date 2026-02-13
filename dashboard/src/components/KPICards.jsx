export default function KPICards({ current, metaMensual }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="label">Total Capacitados</div>
        <div className="value primary">{current.total}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Meta Mensual</div>
        <div className="value">{metaMensual}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Metas Cumplidas</div>
        <div className="value success">{current.cumplidas}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Metas No Cumplidas</div>
        <div className="value warning">{current.noCumplidas}</div>
      </div>
    </div>
  );
}
