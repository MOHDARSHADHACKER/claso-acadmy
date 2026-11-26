import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { attendanceController } from "./attendance.controller";

const router = Router();

router.use(requireAuth);

router.get("/", attendanceController.getBatchAttendance);
router.get("/summary", attendanceController.getSummary);
router.post("/", requireRole("admin", "teacher"), attendanceController.markAttendance);

export default router;
