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
          {stat ? ` • streak: ${stat.currentStreak} (best: ${stat.longestStreak}) • ${stat.completionRate}%` : ""}
        </div>
      </div>

      <div className="progressWrap" aria-label="progress">
        <div className="progressFill" style={{ width: `${pct * 100}%` }} />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn" disabled={busy} onClick={onMinus}>-</button>
        <button className="btn btnPrimary" disabled={busy} onClick={onPlus}>+</button>

        <select
          className="input"
          value={habit.targetPerDay}
          onChange={(e) => onUpdateTarget(e.target.value)}
          style={{ width: 110 }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              cel {i + 1}
            </option>
          ))}
        </select>

        <button className="btn btnDanger" disabled={busy} onClick={onArchive}>
          Archiwizuj
        </button>
      </div>
    </div>
  );
}
