import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import academicRoutes from "./routes/academic.routes";
import peopleRoutes from "./modules/people/people.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import feesRoutes from "./modules/fees/fees.routes";
import learningRoutes from "./modules/learning/learning.routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.get("/api/v1/health", (_req, res) => { res.json({ status: "ok", service: "claso-server" }); });
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1", academicRoutes);
app.use("/api/v1/people", peopleRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/fees", feesRoutes);
app.use("/api/v1/learning", learningRoutes);
  app.use("/api/v1/files", (_req, res) => { res.status(404).json({ code: "NOT_FOUND", message: "File route initialized" }); });
  app.use(errorHandler);
  return app;
}
