import { prisma } from "../prisma.js";

export const userRepo = {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  create({ email, passwordHash }) {
    return prisma.user.create({ data: { email, password: passwordHash } });
  }
};
