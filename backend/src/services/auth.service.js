import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepo } from "../repositories/user.repo.js";

export const authService = {
  async register({ email, password }) {
    const exists = await userRepo.findByEmail(email);
    if (exists) {
      const err = new Error("Email already used");
      err.code = "EMAIL_USED";
      throw err;
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ email, passwordHash: hash });
    return { id: user.id, email: user.email };
  },

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      const err = new Error("Bad credentials");
      err.code = "BAD_CREDENTIALS";
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const err = new Error("Bad credentials");
      err.code = "BAD_CREDENTIALS";
      throw err;
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { subject: user.id, expiresIn: "7d" }
    );

    return { token };
  }
};
