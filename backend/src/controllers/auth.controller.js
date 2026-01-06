import { z } from "zod";
import { authService } from "../services/auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authController = {
  async register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const user = await authService.register(parsed.data);
      return res.status(201).json(user);
    } catch (e) {
      if (e.code === "EMAIL_USED") return res.status(409).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const out = await authService.login(parsed.data);
      return res.json(out);
    } catch (e) {
      if (e.code === "BAD_CREDENTIALS") return res.status(401).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }
};
