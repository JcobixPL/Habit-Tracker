export function isoTodayUTC() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fmtShort(iso) {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

export function daysBackISO(n, baseIso = isoTodayUTC()) {
  const out = [];
  const base = new Date(`${baseIso}T00:00:00.000Z`);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base.getTime() - i * 86400000);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

export function todayCountFromCheckins(checkins, isoDate) {
  const found = (checkins || []).find((c) => c.date.slice(0, 10) === isoDate);
  return found?.count ?? 0;
}

export function todayPercent(count, target) {
  const t = Number(target) || 1;
  return Math.min(count / t, 1);
}

export function buildOverviewSeries({ dates, activeHabits, checkinsByHabit }) {
  const total = activeHabits.length;
  const totalByDate = Object.fromEntries(dates.map((d) => [d, 0]));

  if (total === 0) return [];

  for (const h of activeHabits) {
    const list = checkinsByHabit[h.id] || [];
    const doneSet = new Set(
      list
        .filter((c) => (c.count ?? 0) >= h.targetPerDay)
        .map((c) => c.date.slice(0, 10))
    );

    for (const d of dates) {
      if (doneSet.has(d)) totalByDate[d] += 1;
    }
  }

  return dates.map((d) => {
    const done = totalByDate[d];
    return {
      date: fmtShort(d),
      done,
      total,
      perfect: done === total,
    };
  });
}
