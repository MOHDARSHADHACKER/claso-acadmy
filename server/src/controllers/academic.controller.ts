import { Request, Response, NextFunction } from "express";
import { db } from "../config/db";
import { createCourseSchema, updateCourseSchema, createBatchSchema, updateBatchSchema, createSubjectSchema, assignBatchSubjectSchema, createTimetableSlotSchema, updateTimetableSlotSchema } from "../schemas/academic.schema";

export const listCourses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db("courses").orderBy("id", "asc");
    res.json({ data: rows });
  } catch (err) { next(err); }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createCourseSchema.parse(req.body);
    const [id] = await db("courses").insert(input);
    const row = await db("courses").where({ id }).first();
    res.status(201).json({ data: row });
  } catch (err) { next(err); }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const input = updateCourseSchema.parse(req.body);
    await db("courses").where({ id }).update(input);
    const row = await db("courses").where({ id }).first();
    if (!row) return res.status(404).json({ message: "Course not found" });
    res.json({ data: row });
  } catch (err) { next(err); }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db("courses").where({ id }).del();
    if (!deleted) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (err) { next(err); }
};

export const listBatches = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db("batches as b").leftJoin("courses as c", "b.course_id", "c.id").select("b.*", "c.name as course_name").orderBy("b.id", "asc");
    res.json({ data: rows });
  } catch (err) { next(err); }
};

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createBatchSchema.parse(req.body);
    const [id] = await db("batches").insert(input);
    const row = await db("batches").where({ id }).first();
    res.status(201).json({ data: row });
  } catch (err) { next(err); }
};

export const updateBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const input = updateBatchSchema.parse(req.body);
    await db("batches").where({ id }).update(input);
    const row = await db("batches").where({ id }).first();
    if (!row) return res.status(404).json({ message: "Batch not found" });
    res.json({ data: row });
  } catch (err) { next(err); }
};

export const deleteBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db("batches").where({ id }).del();
    if (!deleted) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted" });
  } catch (err) { next(err); }
};

export const listSubjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db("subjects").orderBy("id", "asc");
    res.json({ data: rows });
  } catch (err) { next(err); }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createSubjectSchema.parse(req.body);
    const [id] = await db("subjects").insert(input);
    const row = await db("subjects").where({ id }).first();
    res.status(201).json({ data: row });
  } catch (err) { next(err); }
};

export const assignBatchSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = assignBatchSubjectSchema.parse(req.body);
    const existing = await db("batch_subjects").where({ batch_id: input.batch_id, subject_id: input.subject_id }).first();
    if (existing) {
      await db("batch_subjects").where({ id: existing.id }).update({ teacher_id: input.teacher_id ?? null });
      const updated = await db("batch_subjects").where({ id: existing.id }).first();
      return res.json({ data: updated });
    }
    const [id] = await db("batch_subjects").insert(input);
    const created = await db("batch_subjects").where({ id }).first();
    res.status(201).json({ data: created });
  } catch (err) { next(err); }
};

export const listTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = db("timetable as t").leftJoin("batches as b", "t.batch_id", "b.id").leftJoin("subjects as s", "t.subject_id", "s.id").leftJoin("users as u", "t.teacher_id", "u.id").select("t.*", "b.name as batch_name", "s.name as subject_name", "u.name as teacher_name");
    if (req.query.batchId) q.where("t.batch_id", Number(req.query.batchId));
    if (req.query.teacherId) q.where("t.teacher_id", Number(req.query.teacherId));
    const rows = await q.orderBy("t.id", "asc");
    res.json({ data: rows });
  } catch (err) { next(err); }
};

export const createTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createTimetableSlotSchema.parse(req.body);
    const [id] = await db("timetable").insert(input);
    const row = await db("timetable").where({ id }).first();
    res.status(201).json({ data: row });
  } catch (err) { next(err); }
};

export const updateTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const input = updateTimetableSlotSchema.parse(req.body);
    await db("timetable").where({ id }).update(input);
    const row = await db("timetable").where({ id }).first();
    if (!row) return res.status(404).json({ message: "Timetable slot not found" });
    res.json({ data: row });
  } catch (err) { next(err); }
};

export const deleteTimetableSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db("timetable").where({ id }).del();
    if (!deleted) return res.status(404).json({ message: "Timetable slot not found" });
    res.json({ message: "Timetable slot deleted" });
  } catch (err) { next(err); }
};

export const getAdminDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [studentsCount] = await db("students").where({ status: "active" }).count("* as count");
    const [teachersCount] = await db("users").where({ role: "teacher", is_active: true }).count("* as count");
    const [batchesCount] = await db("batches").where({ is_active: true }).count("* as count");
    const [openDoubtsCount] = await db("doubts").whereIn("status", ["OPEN", "ASSIGNED"]).count("* as count");
    const [pendingInvoices] = await db("invoices").whereIn("status", ["PENDING", "PARTIAL", "OVERDUE"]).sum("amount as total");
    res.json({
      data: {
        activeStudents: Number(studentsCount?.count || 0),
        activeTeachers: Number(teachersCount?.count || 0),
        activeBatches: Number(batchesCount?.count || 0),
        openDoubts: Number(openDoubtsCount?.count || 0),
        pendingFeesAmount: Number(pendingInvoices?.total || 0),
      },
    });
  } catch (err) { next(err); }
};
