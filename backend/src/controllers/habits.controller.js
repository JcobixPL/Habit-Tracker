import { z } from "zod";
import { habitsService } from "../services/habits.service.js";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  targetPerDay: z.number().int().min(1).max(50).optional()
});

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  targetPerDay: z.number().int().min(1).max(50).optional(),
  active: z.boolean().optional()
});

export const habitsController = {
  async list(req, res) {
    const habits = await habitsService.list(req.user.id);
    return res.json(habits);
  },

  async create(req, res) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const habit = await habitsService.create(req.user.id, parsed.data);
    return res.status(201).json(habit);
  },

  async update(req, res) {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    try {
      const updated = await habitsService.update(req.user.id, req.params.id, parsed.data);
      return res.json(updated);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async restore(req, res) {
    try {
      const updated = await habitsService.restore(req.user.id, req.params.id);
      return res.json(updated);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async remove(req, res) {
    try {
      await habitsService.archive(req.user.id, req.params.id);
      return res.status(204).send();
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async checkin(req, res) {
    const dateStr = req.body?.date;
    try {
      const out = await habitsService.checkin(req.user.id, req.params.id, dateStr);
      return res.status(201).json(out);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      if (e.code === "ARCHIVED") return res.status(400).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async uncheckin(req, res) {
    const dateStr = req.body?.date;
    try {
      const out = await habitsService.uncheckin(req.user.id, req.params.id, dateStr);
      return res.status(200).json(out);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async checkins(req, res) {
    const from = typeof req.query.from === "string" ? req.query.from : null;
    const to = typeof req.query.to === "string" ? req.query.to : null;

    try {
      const out = await habitsService.listCheckins(req.user.id, req.params.id, { from, to });
      return res.json(out);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  },

  async stats(req, res) {
    const range = typeof req.query.range === "string" ? req.query.range : "30";

    try {
      const out = await habitsService.stats(req.user.id, req.params.id, range);
      return res.json(out);
    } catch (e) {
      if (e.code === "NOT_FOUND") return res.status(404).json({ error: e.message });
      return res.status(500).json({ error: "Internal error" });
    }
  }
};
