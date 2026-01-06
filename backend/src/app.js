import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./swagger.js";
import { authRoutes } from "./routes/auth.routes.js";
import { habitsRoutes } from "./routes/habits.routes.js";

export function createApp() {
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

  // Routes
  app.use("/auth", authRoutes);
  app.use("/habits", habitsRoutes);

  return app;
}
