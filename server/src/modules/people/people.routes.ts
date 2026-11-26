import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { peopleController } from "./people.controller";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/teachers", peopleController.listTeachers);
router.post("/teachers", peopleController.createTeacher);
router.patch("/teachers/:id/status", peopleController.toggleTeacherStatus);

router.get("/students", peopleController.listStudents);
router.post("/students", peopleController.createStudent);
router.patch("/students/:id", peopleController.updateStudent);

export default router;
