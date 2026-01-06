import React from "react";

export default function KpiGrid({ kpi, chartDays }) {
  return (
    <div className="kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      <div className="kpi">
        <div className="kpiLabel">Aktywne nawyki</div>
        <div className="kpiValue">{kpi.total}</div>
      </div>
      <div className="kpi">
        <div className="kpiLabel">Średni streak (30d)</div>
        <div className="kpiValue">{kpi.avgStreak}</div>
      </div>
      <div className="kpi">
        <div className="kpiLabel">Średnia realizacja (30d)</div>
        <div className="kpiValue">{kpi.avgCompletion}%</div>
      </div>
      <div className="kpi">
        <div className="kpiLabel">Perfect Days ({chartDays} dni)</div>
        <div className="kpiValue">{kpi.perfectDays}</div>
      </div>
    </div>
  );
}
