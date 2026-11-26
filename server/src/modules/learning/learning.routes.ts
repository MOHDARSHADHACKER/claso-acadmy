import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { learningController } from "./learning.controller";

const router = Router();

router.use(requireAuth);

router.get("/doubts", learningController.listDoubts);
router.post("/doubts", learningController.createDoubt);
router.post("/doubts/:id/messages", learningController.addDoubtMessage);
router.patch("/doubts/:id/status", learningController.updateDoubtStatus);

router.get("/exams", learningController.listExams);
router.post("/exams", requireRole("admin", "teacher"), learningController.createExam);
router.get("/exams/:id/marks", learningController.getExamMarksSheet);
router.post("/exams/:id/marks", requireRole("admin", "teacher"), learningController.saveExamMarks);

export default router;
