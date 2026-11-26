import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import { listCourses, createCourse, updateCourse, deleteCourse, listBatches, createBatch, updateBatch, deleteBatch, listSubjects, createSubject, assignBatchSubject, listTimetable, createTimetableSlot, updateTimetableSlot, deleteTimetableSlot, getAdminDashboard } from "../controllers/academic.controller";

const router = Router();

router.get("/admin/dashboard", requireAuth, requireRole("admin"), getAdminDashboard);

router.get("/courses", requireAuth, listCourses);
router.post("/courses", requireAuth, requireRole("admin"), createCourse);
router.patch("/courses/:id", requireAuth, requireRole("admin"), updateCourse);
router.delete("/courses/:id", requireAuth, requireRole("admin"), deleteCourse);

router.get("/batches", requireAuth, listBatches);
router.post("/batches", requireAuth, requireRole("admin"), createBatch);
router.patch("/batches/:id", requireAuth, requireRole("admin"), updateBatch);
router.delete("/batches/:id", requireAuth, requireRole("admin"), deleteBatch);

router.get("/subjects", requireAuth, listSubjects);
router.post("/subjects", requireAuth, requireRole("admin"), createSubject);
router.post("/batch-subjects", requireAuth, requireRole("admin"), assignBatchSubject);

router.get("/timetable", requireAuth, listTimetable);
router.post("/timetable", requireAuth, requireRole("admin"), createTimetableSlot);
router.patch("/timetable/:id", requireAuth, requireRole("admin"), updateTimetableSlot);
router.delete("/timetable/:id", requireAuth, requireRole("admin"), deleteTimetableSlot);

export default router;
