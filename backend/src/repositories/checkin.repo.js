import { prisma } from "../prisma.js";

export const checkinRepo = {
  findForHabitInDayRange(habitId, dayStart, nextDay) {
    return prisma.habitCheckin.findFirst({
      where: { habitId, date: { gte: dayStart, lt: nextDay } },
      orderBy: { date: "asc" }
    });
  },

  create({ habitId, date, count }) {
    return prisma.habitCheckin.create({ data: { habitId, date, count } });
  },

  update(id, data) {
    return prisma.habitCheckin.update({ where: { id }, data });
  },

  delete(id) {
    return prisma.habitCheckin.delete({ where: { id } });
  },

  listForHabit(habitId, whereDate) {
    const where = { habitId };
    if (whereDate) where.date = whereDate;
    return prisma.habitCheckin.findMany({ where, orderBy: { date: "desc" } });
  },

  listSince(habitId, since) {
    return prisma.habitCheckin.findMany({
      where: { habitId, date: { gte: since } },
      orderBy: { date: "desc" }
    });
  }
};
