import React from "react";
import { todayPercent } from "../logic/dashboardLogic";

export default function HabitRow({
  habit,
  stat,
  count,
  busy,
  onMinus,
  onPlus,
  onUpdateTarget,
  onArchive,
}) {
  const pct = todayPercent(count, habit.targetPerDay);

  return (
    <div className="habitRow">
      <div style={{ flex: 1 }}>
        <div className="habitName">{habit.name}</div>
        <div className="sub">
          Cel: {habit.targetPerDay} / dzień • Dziś: {count}/{habit.targetPerDay}
          {stat ? ` • Streak: ${stat.currentStreak} (Rekord: ${stat.longestStreak}) • (Średni postęp z 30 dni: ${stat.completionRate}%)` : ""}
        </div>
      </div>

      <div className="progressWrap" aria-label="progress">
        <div className="progressFill" style={{ width: `${pct * 100}%` }} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn" disabled={busy} onClick={onMinus}>-</button>
        <button className="btn btnPrimary" disabled={busy} onClick={onPlus}>+</button>

        <input
  	  className="input"
  	  type="number"
  	  min={1}
  	  max={50}
  	  value={habit.targetPerDay}
  	  onChange={(e) => onUpdateTarget(e.target.value)}
  	  style={{ width: 100 }}
	/>

        <button className="btn btnDanger" disabled={busy} onClick={onArchive}>
          Archiwizuj
        </button>
      </div>
    </div>
  );
}
