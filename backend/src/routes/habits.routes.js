import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { habitsController } from "../controllers/habits.controller.js";

export const habitsRoutes = Router();

/**
 * @openapi
 * /habits:
 *   get:
 *     summary: List habits
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
habitsRoutes.get("/", auth, habitsController.list);

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
habitsRoutes.post("/", auth, habitsController.create);

habitsRoutes.patch("/:id", auth, habitsController.update);
habitsRoutes.post("/:id/restore", auth, habitsController.restore);
habitsRoutes.delete("/:id", auth, habitsController.remove);
habitsRoutes.post("/:id/checkin", auth, habitsController.checkin);
habitsRoutes.post("/:id/uncheckin", auth, habitsController.uncheckin);
habitsRoutes.get("/:id/checkins", auth, habitsController.checkins);
habitsRoutes.get("/:id/stats", auth, habitsController.stats);
