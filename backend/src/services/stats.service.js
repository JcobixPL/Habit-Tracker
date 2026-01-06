import { toISODateOnly } from "../utils/date.js";

export function computeStreaks(checkins, targetPerDay) {
  const doneDays = new Set(
    checkins
      .filter(c => c.count >= targetPerDay)
      .map(c => toISODateOnly(c.date))
  );

  const today = toISODateOnly(new Date());
  const yesterday = toISODateOnly(new Date(Date.now() - 86400000));

  let start = doneDays.has(today) ? today : yesterday;

  let current = 0;
  {
    let cursor = new Date(`${start}T00:00:00.000Z`);
    while (true) {
      const key = toISODateOnly(cursor);
      if (!doneDays.has(key)) break;
      current += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }

  const dates = Array.from(doneDays).sort();
  let longest = 0;
  let run = 0;
  let prev = null;

  for (const d of dates) {
    if (!prev) {
      run = 1;
    } else {
      const prevTime = new Date(`${prev}T00:00:00.000Z`).getTime();
      const curTime = new Date(`${d}T00:00:00.000Z`).getTime();
      if (curTime - prevTime === 86400000) run += 1;
      else run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  return { currentStreak: current, longestStreak: longest };
}
