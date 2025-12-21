import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

import { prisma } from "./prisma.js";
import { auth } from "./middlewares/auth.js";
import { swaggerSpec } from "./swagger.js";
import { toISODateOnly, startOfUTCDate } from "./utils/date.js";

const app = express();
app.set("etag", false);
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Created }
 */
app.post("/auth/register", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email already used" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash } });
  return res.status(201).json({ id: user.id, email: user.email });
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Token }
 */
app.post("/auth/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Bad credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Bad credentials" });

  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: "7d" }
  );

  res.json({ token });
});

/**
 * @openapi
 * /habits:
 *   get:
 *     summary: List habits
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
app.get("/habits", auth, async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  res.json(habits);
});

/**
 * @openapi
 * /habits:
 *   post:
 *     summary: Create habit
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               targetPerDay: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Created }
 */
app.post("/habits", auth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(80),
    description: z.string().max(500).optional(),
    targetPerDay: z.number().int().min(1).max(50).optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const habit = await prisma.habit.create({
    data: {
      userId: req.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      targetPerDay: parsed.data.targetPerDay ?? 1
    }
  });

  res.status(201).json(habit);
});

app.patch("/habits/:id", auth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().max(500).optional().nullable(),
    targetPerDay: z.number().int().min(1).max(50).optional(),
    active: z.boolean().optional()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const id = req.params.id;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.habit.update({
    where: { id },
    data: parsed.data
  });

  res.json(updated);
});

app.post("/habits/:id/restore", auth, async (req, res) => {
  const id = req.params.id;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.habit.update({
    where: { id },
    data: { active: true }
  });

  res.json(updated);
});

app.delete("/habits/:id", auth, async (req, res) => {
  const id = req.params.id;
  const habit = await prisma.habit.findFirst({
    where: { id, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Not found" });

  // soft delete
  await prisma.habit.update({ where: { id }, data: { active: false } });
  res.status(204).send();
});

app.post("/habits/:id/checkin", auth, async (req, res) => {
  const id = req.params.id;
  const dateStr = req.body?.date; // "YYYY-MM-DD" opcjonalnie

  const base = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  const dayStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const nextDay = new Date(dayStart.getTime() + 86400000);

  const habit = await prisma.habit.findFirst({
    where: { id, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Not found" });
  if (!habit.active) return res.status(400).json({ error: "Habit is archived" });

  // SZUKAMY checkina dla tego dnia po zakresie, a nie po equality datetime
  const existing = await prisma.habitCheckin.findFirst({
    where: {
      habitId: id,
      date: { gte: dayStart, lt: nextDay }
    },
    orderBy: { date: "asc" } // jak jest kilka, bierzemy pierwszy
  });

  if (!existing) {
    const created = await prisma.habitCheckin.create({
      data: {
        habitId: id,
        date: dayStart,
        count: 1
      }
    });
    return res.status(201).json(created);
  }

const nextCount = (existing.count ?? 0) + 1;

  const updated = await prisma.habitCheckin.update({
    where: { id: existing.id },
    data: { count: nextCount }
  });

  return res.status(201).json(updated);
});

app.post("/habits/:id/uncheckin", auth, async (req, res) => {
  const id = req.params.id;
  const dateStr = req.body?.date;

  const base = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  const dayStart = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const nextDay = new Date(dayStart.getTime() + 86400000);

  const habit = await prisma.habit.findFirst({
    where: { id, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Not found" });

  const existing = await prisma.habitCheckin.findFirst({
    where: {
      habitId: id,
      date: { gte: dayStart, lt: nextDay }
    },
    orderBy: { date: "asc" }
  });

  if (!existing) {
    return res.status(200).json({ count: 0, removed: false });
  }

  const nextCount = (existing.count ?? 0) - 1;

  if (nextCount <= 0) {
    await prisma.habitCheckin.delete({ where: { id: existing.id } });
    return res.status(200).json({ count: 0, removed: true });
  }

  const updated = await prisma.habitCheckin.update({
    where: { id: existing.id },
    data: { count: nextCount }
  });

  return res.status(200).json(updated);
});

app.get("/habits/:id/checkins", auth, async (req, res) => {
  const habitId = req.params.id;
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const from = typeof req.query.from === "string" ? req.query.from : null;
  const to = typeof req.query.to === "string" ? req.query.to : null;

  const where = { habitId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = startOfUTCDate(from);
    if (to) where.date.lte = startOfUTCDate(to);
  }

  const checkins = await prisma.habitCheckin.findMany({
    where,
    orderBy: { date: "desc" }
  });

  res.json(checkins);
});

function computeStreaks(checkins, targetPerDay) {
  // checkins: [{date, count}] (date as Date), can include gaps
  const doneDays = new Set(
    checkins
      .filter(c => c.count >= targetPerDay)
      .map(c => toISODateOnly(c.date))
  );

  const today = toISODateOnly(new Date());
  const yesterday = toISODateOnly(new Date(Date.now() - 86400000));

  // UX-friendly: if today not done yet, start from yesterday
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

  // longest streak: walk backwards over sorted unique done days
  const dates = Array.from(doneDays).sort(); // ascending
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

app.get("/habits/:id/stats", auth, async (req, res) => {
  const habitId = req.params.id;
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: req.user.id }
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  // default range last 30 days
  const range = typeof req.query.range === "string" ? req.query.range : "30";
  const days = Math.max(1, Math.min(365, parseInt(range, 10) || 30));

  const since = new Date(Date.now() - days * 86400000);

  const checkins = await prisma.habitCheckin.findMany({
    where: { habitId, date: { gte: since } },
    orderBy: { date: "desc" }
  });

  const { currentStreak, longestStreak } = computeStreaks(checkins, habit.targetPerDay);

  // completion rate: days in range with done >= target / total days
  const doneSet = new Set(
    checkins.filter(c => c.count >= habit.targetPerDay).map(c => toISODateOnly(c.date))
  );

  const completionRate = Math.round((doneSet.size / days) * 100);

  res.json({
    habitId,
    days,
    currentStreak,
    longestStreak,
    completionRate
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API on :${port} (docs: /api-docs)`));
