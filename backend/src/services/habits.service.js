import { habitRepo } from "../repositories/habit.repo.js";
import { checkinRepo } from "../repositories/checkin.repo.js";
import { computeStreaks } from "./stats.service.js";
import { startOfUTCDate, toISODateOnly } from "../utils/date.js";

function dayBoundsUTC(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  const dayStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const nextDay = new Date(dayStart.getTime() + 86400000);
  return { dayStart, nextDay };
}

export const habitsService = {
  list(userId) {
    return habitRepo.listByUser(userId);
  },

  async create(userId, { name, description, targetPerDay }) {
    return habitRepo.create({
      userId,
      name,
      description,
      targetPerDay: targetPerDay ?? 1
    });
  },

  async update(userId, id, data) {
    const habit = await habitRepo.findForUser(id, userId);
    if (!habit) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    return habitRepo.update(id, data);
  },

  async archive(userId, id) {
    const habit = await habitRepo.findForUser(id, userId);
    if (!habit) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    await habitRepo.update(id, { active: false });
    return;
  },

  async restore(userId, id) {
    const habit = await habitRepo.findForUser(id, userId);
    if (!habit) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    return habitRepo.update(id, { active: true });
  },

  async checkin(userId, habitId, dateStr) {
    const habit = await habitRepo.findForUser(habitId, userId);
    if (!habit) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (!habit.active) {
      const err = new Error("Habit is archived");
      err.code = "ARCHIVED";
      throw err;
    }

    const { dayStart, nextDay } = dayBoundsUTC(dateStr);

    const existing = await checkinRepo.findForHabitInDayRange(habitId, dayStart, nextDay);

    if (!existing) {
      return checkinRepo.create({ habitId, date: dayStart, count: 1 });
    }

    const nextCount = (existing.count ?? 0) + 1;
    return checkinRepo.update(existing.id, { count: nextCount });
  },

  async uncheckin(userId, habitId, dateStr) {
    const habit = await habitRepo.findForUser(habitId, userId);
    if (!habit) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const { dayStart, nextDay } = dayBoundsUTC(dateStr);

    const existing = await checkinRepo.findForHabitInDayRange(habitId, dayStart, nextDay);

    if (!existing) return { count: 0, removed: false };

    const nextCount = (existing.count ?? 0) - 1;

    if (nextCount <= 0) {
      await checkinRepo.delete(existing.id);
      return { count: 0, removed: true };
    }

    return checkinRepo.update(existing.id, { count: nextCount });
  },

  async listCheckins(userId, habitId, { from, to }) {
    const habit = await habitRepo.findForUser(habitId, userId);
    if (!habit) {
      const err = new Error("Habit not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    let whereDate = null;
    if (from || to) {
      whereDate = {};
      if (from) whereDate.gte = startOfUTCDate(from);
      if (to) whereDate.lte = startOfUTCDate(to);
    }

    return checkinRepo.listForHabit(habitId, whereDate);
  },

  async stats(userId, habitId, rangeDays) {
    const habit = await habitRepo.findForUser(habitId, userId);
    if (!habit) {
      const err = new Error("Habit not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    const days = Math.max(1, Math.min(365, Number(rangeDays) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const checkins = await checkinRepo.listSince(habitId, since);

    const { currentStreak, longestStreak } = computeStreaks(checkins, habit.targetPerDay);

    const doneSet = new Set(
      checkins
        .filter(c => c.count >= habit.targetPerDay)
        .map(c => toISODateOnly(c.date))
    );

    const completionRate = Math.round((doneSet.size / days) * 100);

    return {
      habitId,
      days,
      currentStreak,
      longestStreak,
      completionRate
    };
  }
};
