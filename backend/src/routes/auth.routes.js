import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";

export const authRoutes = Router();

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
authRoutes.post("/register", authController.register);

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
authRoutes.post("/login", authController.login);
