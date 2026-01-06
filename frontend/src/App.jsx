import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Link, Route, Routes, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { api, clearToken, getToken, setToken } from "./api.js";

function isoTodayUTC() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtShort(iso) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

function daysBackISO(n) {
  const out = [];
  const base = new Date(`${isoTodayUTC()}T00:00:00.000Z`);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base.getTime() - i * 86400000);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

function AppShell({ children, onLogout }) {
  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div>
            <div className="h1">Habit Tracker</div>
          </div>
        </div>

        <button className="btn btnDanger" onClick={onLogout}>
          Wyloguj
        </button>
      </div>

      {children}
    </div>
  );
}

function LoginPage({ onAuthed }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setBusy(true);
    setError("");
    try {
      const { token } = await api.login(email, password);
      setToken(token);
      onAuthed(token);
      nav("/app");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginWrap">
      <div className="panel loginCard">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div>
            <div className="h1">Zaloguj się</div>
          </div>
        </div>

        <div className="grid2">
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
          </div>
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Hasło
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="hasło"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            className="btn btnPrimary"
            disabled={busy}
            onClick={login}
            style={{ flex: 1 }}
          >
            Zaloguj
          </button>
          <Link
            className="btn"
            to="/register"
            style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
          >
            Rejestracja
          </Link>
        </div>

        <div className="hr" />

        <div className="note">
          Swagger API:{" "}
          <a
            href="http://localhost:4000/api-docs"
            target="_blank"
            rel="noreferrer"
          >
            http://localhost:4000/api-docs
          </a>
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

function RegisterPage({ onAuthed }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function register() {
    setError("");
    if (password !== password2) {
      setError("Hasła muszą być takie same.");
      return;
    }
    setBusy(true);
    try {
      await api.register(email, password);
      const { token } = await api.login(email, password);
      setToken(token);
      onAuthed(token);
      nav("/app");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginWrap">
      <div className="panel loginCard">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div>
            <div className="h1">Rejestracja</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div className="sub" style={{ marginBottom: 6 }}>
              Email
            </div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="np. email@email.pl"
            />
          </div>

          <div className="grid2">
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Hasło
              </div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="hasło"
              />
            </div>
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Powtórz hasło
              </div>
              <input
                className="input"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="powtórz hasło"
              />
            </div>
          </div>

          <button className="btn btnPrimary" disabled={busy} onClick={register}>
            Utwórz konto
          </button>

          <Link
            className="btn"
            to="/login"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            Wróć do logowania
          </Link>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ onLogout }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [habits, setHabits] = useState([]);
  const [statsById, setStatsById] = useState({});
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [selectedDate, setSelectedDate] = useState(isoTodayUTC());
  const [chartDays, setChartDays] = useState(14);
  const [showArchived, setShowArchived] = useState(false);

  const activeHabits = useMemo(() => habits.filter((h) => h.active), [habits]);
  const archivedHabits = useMemo(
    () => habits.filter((h) => !h.active),
    [habits]
  );

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
  }, []);

  // Aggregations per day
  const [overview, setOverview] = useState([]);
  const [allDoneByDate, setAllDoneByDate] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function buildDailyAggregations() {
      const days = chartDays;
      const dates = daysBackISO(days);
      const total = activeHabits.length;

      const doneCountByDate = Object.fromEntries(dates.map((d) => [d, 0]));
      const allDoneMap = Object.fromEntries(dates.map((d) => [d, false]));

      if (total === 0) {
        if (!cancelled) {
          setOverview([]);
          setAllDoneByDate({});
        }
        return;
      }

      await Promise.all(
        activeHabits.map(async (h) => {
          try {
            const from = dates[0];
            const to = dates[dates.length - 1];
            const checkins = await api.checkins(h.id, from, to);

            setCheckinsByHabit((prev) => ({
              ...prev,
              [h.id]: checkins,
            }));

            const doneSet = new Set(
              checkins
                .filter((c) => (c.count ?? 0) >= h.targetPerDay)
                .map((c) => c.date.slice(0, 10))
            );

            for (const d of dates) {
              if (doneSet.has(d)) doneCountByDate[d] += 1;
            }
          } catch {
            // ignore
          }
        })
      );

      for (const d of dates) {
        allDoneMap[d] = doneCountByDate[d] === total;
      }

      const series = dates.map((d) => ({
        date: fmtShort(d),
        done: doneCountByDate[d],
        total,
        perfect: allDoneMap[d],
      }));

      if (!cancelled) {
        setOverview(series);
        setAllDoneByDate(allDoneMap);
      }
    }

    buildDailyAggregations();
    return () => {
      cancelled = true;
    };
  }, [activeHabits, chartDays]);

  const [checkinsByHabit, setCheckinsByHabit] = useState({});

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
    const avgCompletion = stats.length
      ? Math.round(completionAvg / stats.length)
      : 0;
    const perfectDays = Object.values(allDoneByDate || {}).filter(Boolean).length;

    return { total, avgStreak, best, avgCompletion, perfectDays };
  }, [activeHabits, statsById, allDoneByDate]);

  async function addHabit() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      await api.createHabit({ name, targetPerDay: Number(newTarget) || 1 });
      setNewName("");
      setNewTarget(1);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkin(habitId) {
    setBusy(true);
    setError("");
    try {
      await api.checkin(habitId, selectedDate);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function uncheckin(habitId) {
    setBusy(true);
    setError("");
    try {
      await api.uncheckin(habitId, selectedDate);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function archive(habitId) {
    setBusy(true);
    setError("");
    try {
      await api.deleteHabit(habitId);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function restore(habitId) {
    setBusy(true);
    setError("");
    try {
      await api.restoreHabit(habitId);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateTarget(habitId, targetPerDay) {
    setBusy(true);
    setError("");
    try {
      await api.updateHabit(habitId, {
        targetPerDay: Number(targetPerDay) || 1,
      });
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function todayProgress(habitId, target) {
    const today = selectedDate;
    const list = overviewRawByHabit[habitId] || [];
    const found = list.find((c) => c.date.slice(0, 10) === today);
    return Math.min(found?.count ?? 0, target);
  }

  return (
    <AppShell onLogout={onLogout}>
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

      <div style={{ height: 12 }} />

      <div className="row">
        {/* Left */}
        <div className="panel">
          <div className="panelHeader">
            <div>
              <div className="panelTitle">
                Aktywność (ukończone nawyki / dzień)
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                className="select"
                value={chartDays}
                onChange={(e) => setChartDays(Number(e.target.value))}
              >
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={30}>30 dni</option>
              </select>
            </div>
          </div>

          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 12,
                    fill: "rgba(255,255,255,0.75)",
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                    fill: "rgba(255,255,255,0.75)",
                  }}
                />
		<Tooltip
  		  formatter={(value, name) => {
    		    if (name === "done") {
      			return [value, "Wykonano"];
    		    }
    		    return [value, name];
  		   }}
		/>
                <Bar dataKey="done" radius={[6, 6, 0, 0]}>
                  {overview.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.perfect ? "#22c55e" : "#7c5cff"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <hr className="hr" />

          <div className="grid3">
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Szukaj
              </div>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="np. woda, nauka..."
              />
            </div>
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Check-in na datę
              </div>
              <input
                className="input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "end",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                className="btn"
                onClick={() => setShowArchived(false)}
                disabled={!showArchived}
              >
                Aktywne
              </button>
              <button
                className="btn"
                onClick={() => setShowArchived(true)}
                disabled={showArchived}
              >
                Archiwum ({archivedHabits.length})
              </button>
            </div>
          </div>

          {error && (
            <div className="error" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}

          <div style={{ height: 12 }} />

          {!showArchived && (
            <div className="habitList">
              {filteredActive.length === 0 && (
                <div className="note">Brak aktywnych nawyków.</div>
              )}

              {filteredActive.map((h) => {
                const s = statsById[h.id];
                return (
                  <div className="habitCard" key={h.id}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{h.name}</div>
                        {s && (
                          <>
                            <span className="badge">
                              streak:{" "}
                              <b style={{ color: "var(--text)" }}>
                                {s.currentStreak}
                              </b>
                            </span>
                            <span className="badge">
                              rekord:{" "}
                              <b style={{ color: "var(--text)" }}>
                                {s.longestStreak}
                              </b>
                            </span>
                            <span className="badge">
                              30d:{" "}
                              <b style={{ color: "var(--text)" }}>
                                {s.completionRate}%
                              </b>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="sub" style={{ marginTop: 6 }}>
                        Postęp dziś:{" "}
                        <b>
                          {checkinsByHabit[h.id]?.find(
                            (c) => c.date.slice(0, 10) === selectedDate
                          )?.count ?? 0}
                          {" / "}
                          {h.targetPerDay}
                        </b>
                      </div>

                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{
                            width: `${Math.min(
                              100,
                              ((checkinsByHabit[h.id]?.find(
                                (c) => c.date.slice(0, 10) === selectedDate
                              )?.count ?? 0) /
                                h.targetPerDay) *
                                100
                            )}%`,
                          }}
                        />
                      </div>

                      <div style={{ marginTop: 10 }} className="grid2">
                        <div>
                          <div className="sub" style={{ marginBottom: 6 }}>
                            Zmień target
                          </div>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            max={50}
                            defaultValue={h.targetPerDay}
                            onBlur={(e) => updateTarget(h.id, e.target.value)}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div className="note">
                            Możesz robić check-in wstecz (wybierz datę wyżej).
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        className="btn btnPrimary"
                        disabled={busy}
                        onClick={() => checkin(h.id)}
                      >
                        +1
                      </button>
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => uncheckin(h.id)}
                      >
                        Cofnij
                      </button>
                      <button
                        className="btn btnDanger"
                        disabled={busy}
                        onClick={() => archive(h.id)}
                      >
                        Archiwizuj
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showArchived && (
            <div className="habitList">
              {archivedHabits.length === 0 && (
                <div className="note">Archiwum jest puste.</div>
              )}
              {archivedHabits.map((h) => (
                <div className="habitCard" key={h.id}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{h.name}</div>
                    <div className="sub" style={{ marginTop: 6 }}>
                      Zarchiwizowany • target: <b>{h.targetPerDay}</b>/dzień
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="btn btnPrimary"
                      disabled={busy}
                      onClick={() => restore(h.id)}
                    >
                      ♻️ Przywróć
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="panel">
          <div className="panelHeader">
            <div>
              <div className="panelTitle">Dodaj nowy nawyk</div>
              <div className="sub">Nazwa + target/dzień</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Nazwa
              </div>
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Woda 2L"
              />
            </div>
            <div>
              <div className="sub" style={{ marginBottom: 6 }}>
                Target / dzień
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
              Dodaj nawyk
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function App() {
  const [tokenState, setTokenState] = useState(getToken());
  const isAuthed = !!tokenState;

  function logout() {
    clearToken();
    setTokenState("");
  }

  function onAuthed(token) {
    setTokenState(token);
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthed ? "/app" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={
          isAuthed ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage onAuthed={onAuthed} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthed ? (
            <Navigate to="/app" replace />
          ) : (
            <RegisterPage onAuthed={onAuthed} />
          )
        }
      />
      <Route
        path="/app"
        element={
          isAuthed ? (
            <DashboardPage onLogout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
