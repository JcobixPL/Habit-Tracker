import { prisma } from "../prisma.js";

export const habitRepo = {
  listByUser(userId) {
    return prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  },

  findForUser(id, userId) {
    return prisma.habit.findFirst({ where: { id, userId } });
  },

  create({ userId, name, description, targetPerDay }) {
    return prisma.habit.create({
      data: { userId, name, description, targetPerDay }
    });
  },

  update(id, data) {
    return prisma.habit.update({ where: { id }, data });
  }
};
