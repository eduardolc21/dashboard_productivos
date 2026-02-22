export default function KPICards({ current }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="label">Total Capacitados</div>
        <div className="value primary">{current.total}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Meta Total del Mes</div>
        <div className="value">{current.totalMeta}</div>
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
