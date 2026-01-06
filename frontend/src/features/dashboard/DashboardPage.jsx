import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../../shared/AppShell.jsx";
import { api } from "../../api.js";
import { useAuth } from "../../app/providers/AuthProvider.jsx";

import KpiGrid from "./components/KpiGrid.jsx";
import ActivityChart from "./components/ActivityChart.jsx";
import HabitRow from "./components/HabitRow.jsx";

import { useAsyncAction } from "../../shared/hooks/useAsyncAction.js";
import {
  isoTodayUTC,
  daysBackISO,
  buildOverviewSeries,
  todayCountFromCheckins,
} from "./logic/dashboardLogic.js";

export default function DashboardPage() {
  const auth = useAuth();
  const { busy, error, setError, run } = useAsyncAction();

  const [habits, setHabits] = useState([]);
  const [statsById, setStatsById] = useState({});
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [selectedDate, setSelectedDate] = useState(isoTodayUTC());
  const [chartDays, setChartDays] = useState(14);
  const [showArchived, setShowArchived] = useState(false);

  const [overview, setOverview] = useState([]);
  const [allDoneByDate, setAllDoneByDate] = useState({});
  const [checkinsByHabit, setCheckinsByHabit] = useState({});

  const activeHabits = useMemo(() => habits.filter((h) => h.active), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => !h.active), [habits]);

  const filteredActive = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeHabits;
    return activeHabits.filter((h) => h.name.toLowerCase().includes(q));
  }, [activeHabits, search]);

  async function refreshAll() {
    setError("");
    const list = await api.habits();
    setHabits(list);

    const entries = await Promise.all(
      list
        .filter((h) => h.active)
        .map(async (h) => {
          try {
            const s = await api.stats(h.id, 30);
            return [h.id, s];
          } catch {
            return [h.id, null];
          }
        })
    );
    setStatsById(Object.fromEntries(entries.filter(([, v]) => v)));
  }

  useEffect(() => {
    refreshAll().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Budowa checkinsByHabit + overview (agregacja pod wykres)
  useEffect(() => {
    let cancelled = false;

    async function buildData() {
      const dates = daysBackISO(chartDays);
      const total = activeHabits.length;

      // reset w przypadku braku nawyków
      if (total === 0) {
        if (!cancelled) {
          setCheckinsByHabit({});
          setOverview([]);
          setAllDoneByDate({});
        }
        return;
      }

      // 1) pobierz checkiny dla każdego aktywnego nawyku w zakresie
      const from = dates[0];
      const to = dates[dates.length - 1];

      const results = await Promise.all(
        activeHabits.map(async (h) => {
          try {
            const checkins = await api.checkins(h.id, from, to);
            return [h.id, checkins];
          } catch {
            return [h.id, []];
          }
        })
      );

      const byHabit = Object.fromEntries(results);

      // 2) zbuduj serię na wykres (pure func)
      const series = buildOverviewSeries({
        dates,
        activeHabits,
        checkinsByHabit: byHabit,
      });

      // 3) mapka perfect-day (do KPI)
      const allDoneMap = {};
      for (let i = 0; i < dates.length; i++) {
        allDoneMap[dates[i]] = !!series[i]?.perfect;
      }

      if (!cancelled) {
        setCheckinsByHabit(byHabit);
        setOverview(series);
        setAllDoneByDate(allDoneMap);
      }
    }

    buildData();
    return () => {
      cancelled = true;
    };
  }, [activeHabits, chartDays]);

  const kpi = useMemo(() => {
    const total = activeHabits.length;
    let streakSum = 0;
    let best = 0;
    let completionAvg = 0;

    const stats = activeHabits.map((h) => statsById[h.id]).filter(Boolean);
    for (const s of stats) {
      streakSum += s.currentStreak;
      if (s.longestStreak > best) best = s.longestStreak;
      completionAvg += s.completionRate;
    }

    const avgStreak = stats.length ? Math.round(streakSum / stats.length) : 0;
    const avgCompletion = stats.length ? Math.round(completionAvg / stats.length) : 0;
    const perfectDays = Object.values(allDoneByDate || {}).filter(Boolean).length;

    return { total, avgStreak, best, avgCompletion, perfectDays };
  }, [activeHabits, statsById, allDoneByDate]);

  async function addHabit() {
    const name = newName.trim();
    if (!name) return;

    await run(async () => {
      await api.createHabit({ name, targetPerDay: Number(newTarget) || 1 });
      setNewName("");
      setNewTarget(1);
      await refreshAll();
    });
  }

  async function checkin(habitId) {
    await run(async () => {
      await api.checkin(habitId, selectedDate);
      await refreshAll();
    });
  }

  async function uncheckin(habitId) {
    await run(async () => {
      await api.uncheckin(habitId, selectedDate);
      await refreshAll();
    });
  }

  async function archive(habitId) {
    await run(async () => {
      await api.deleteHabit(habitId);
      await refreshAll();
    });
  }

  async function restore(habitId) {
    await run(async () => {
      await api.restoreHabit(habitId);
      await refreshAll();
    });
  }

  async function updateTarget(habitId, targetPerDay) {
    await run(async () => {
      await api.updateHabit(habitId, { targetPerDay: Number(targetPerDay) || 1 });
      await refreshAll();
    });
  }

  function todayCount(habitId) {
    return todayCountFromCheckins(checkinsByHabit[habitId], selectedDate);
  }

  return (
    <AppShell onLogout={auth.logout}>
      <KpiGrid kpi={kpi} chartDays={chartDays} />

      <div style={{ height: 12 }} />

      <div className="row">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <div className="panelTitle">Aktywność (ukończone nawyki / dzień)</div>            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="sub">Zakres:</div>
              <select
                className="input"
                value={chartDays}
                onChange={(e) => setChartDays(Number(e.target.value))}
                style={{ width: 140 }}
              >
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={30}>30 dni</option>
              </select>
            </div>
          </div>

          <ActivityChart data={overview} />
        </div>

        <div className="panel" style={{ minWidth: 360 }}>
          <div className="panelHeader">
            <div>
              <div className="panelTitle">Dodaj nawyk</div>
              <div className="sub">Zdefiniuj cel dzienny (min. 1).</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="np. Woda, czytanie, siłownia..."
            />


              <div>
                <div className="sub" style={{ marginBottom: 6 }}>
                  Cel dzienny
                </div>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={50}
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
              </div>
            <button className="btn btnPrimary" disabled={busy} onClick={addHabit}>
              Dodaj
            </button>

            {error && <div className="error">{error}</div>}
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="panel">
        <div
          className="panelHeader"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div className="panelTitle">Twoje nawyki</div>
            <div className="sub">Klikaj + / - dla wybranej daty.</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="sub">Data:</div>
            <input
              className="input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 160 }}
            />
          </div>
        </div>

	<div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
  <input
    className="input"
    placeholder="Szukaj nawyku..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{ flex: 1 }}
  />

  <label style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
    <input
      type="checkbox"
      checked={showArchived}
      onChange={(e) => setShowArchived(e.target.checked)}
    />
    <span className="sub">Pokaż archiwalne</span>
  </label>
</div>

        <div className="hr" />

        {filteredActive.length === 0 && (
          <div className="note">Brak aktywnych nawyków (dodaj pierwszy na górze).</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredActive.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              stat={statsById[h.id]}
              count={todayCount(h.id)}
              busy={busy}
              onMinus={() => uncheckin(h.id)}
              onPlus={() => checkin(h.id)}
              onUpdateTarget={(v) => updateTarget(h.id, v)}
              onArchive={() => archive(h.id)}
            />
          ))}
        </div>

        {showArchived && archivedHabits.length > 0 && (
          <>
            <div className="hr" />
            <div className="panelTitle" style={{ marginBottom: 8 }}>
              Archiwalne
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {archivedHabits.map((h) => (
                <div className="habitRow" key={h.id}>
                  <div style={{ flex: 1 }}>
                    <div className="habitName">{h.name}</div>
                    <div className="sub">(archiwalne)</div>
                  </div>

                  <button className="btn" disabled={busy} onClick={() => restore(h.id)}>
                    Przywróć
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
