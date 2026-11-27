// import { Request, Response, NextFunction } from "express";
// import { ZodError } from "zod";
// import { db } from "../../config/db";
// import { AppError } from "../../middleware/error.middleware";
// import {
//   createDoubtSchema,
//   addDoubtMessageSchema,
//   updateDoubtStatusSchema,
//   createExamSchema,
//   saveMarksSchema,
// } from "./learning.schema";

// function fmtDate(val: unknown): string {
//   if (!val) return "";
//   if (val instanceof Date) return val.toISOString().slice(0, 10);
//   return String(val).slice(0, 10);
// }

// async function resolveStudentId(req: Request, explicitId?: number): Promise<number | null> {
//   if (explicitId) return explicitId;
//   if (!req.user?.id) return null;
//   const studentRow = await db("students").where({ user_id: req.user.id }).first();
//   if (studentRow) return Number(studentRow.id);
//   const firstStudent = await db("students").orderBy("id", "asc").first();
//   return firstStudent ? Number(firstStudent.id) : null;
// }

// export const learningController = {
//   async listDoubts(_req: Request, res: Response, next: NextFunction) {
//     try {
//       const doubts = await db("doubts as d")
//         .leftJoin("students as s", "d.student_id", "s.id")
//         .leftJoin("users as su", "s.user_id", "su.id")
//         .leftJoin("batches as b", "d.batch_id", "b.id")
//         .leftJoin("subjects as sub", "d.subject_id", "sub.id")
//         .leftJoin("users as au", "d.assignee_id", "au.id")
//         .select(
//           "d.id",
//           "d.student_id",
//           "su.name as student_name",
//           "su.admission_no",
//           "d.batch_id",
//           "b.name as batch_name",
//           "d.subject_id",
//           "sub.name as subject_name",
//           "d.assignee_id",
//           "au.name as assignee_name",
//           "d.title",
//           "d.status",
//           "d.reopen_count",
//           "d.created_at"
//         )
//         .orderBy("d.id", "desc");

//       const doubtIds = doubts.map((d) => Number(d.id));
//       const messages =
//         doubtIds.length > 0
//           ? await db("doubt_messages as dm")
//               .leftJoin("users as u", "dm.sender_id", "u.id")
//               .whereIn("dm.doubt_id", doubtIds)
//               .select(
//                 "dm.id",
//                 "dm.doubt_id",
//                 "dm.sender_id",
//                 "u.name as sender_name",
//                 "u.role as sender_role",
//                 "dm.message",
//                 "dm.created_at"
//               )
//               .orderBy("dm.id", "asc")
//           : [];

//       const byDoubt = new Map<number, typeof messages>();
//       for (const m of messages) {
//         const list = byDoubt.get(Number(m.doubt_id)) || [];
//         list.push(m);
//         byDoubt.set(Number(m.doubt_id), list);
//       }

//       res.json({
//         data: doubts.map((d) => ({
//           id: Number(d.id),
//           student_id: Number(d.student_id),
//           student_name: d.student_name || "Student #" + d.student_id,
//           admission_no: d.admission_no || "",
//           batch_id: Number(d.batch_id),
//           batch_name: d.batch_name || "Batch #" + d.batch_id,
//           subject_id: Number(d.subject_id),
//           subject_name: d.subject_name || "Subject #" + d.subject_id,
//           assignee_id: d.assignee_id ? Number(d.assignee_id) : null,
//           assignee_name: d.assignee_name || null,
//           title: d.title,
//           status: d.status,
//           reopen_count: Number(d.reopen_count || 0),
//           messages: (byDoubt.get(Number(d.id)) || []).map((m) => ({
//             id: Number(m.id),
//             doubt_id: Number(m.doubt_id),
//             sender_id: Number(m.sender_id),
//             sender_name: m.sender_name || "User #" + m.sender_id,
//             sender_role: m.sender_role || "student",
//             message: m.message,
//             created_at: m.created_at,
//           })),
//         })),
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   async createDoubt(req: Request, res: Response, next: NextFunction) {
//     try {
//       const input = createDoubtSchema.parse(req.body);
//       const studentId = await resolveStudentId(req, input.student_id);
//       if (!studentId) {
//         throw new AppError(400, "STUDENT_NOT_FOUND", "No student profile available for creating doubt");
//       }

//       const slaDue = new Date(Date.now() + 24 * 60 * 60 * 1000);

//       const doubtId = await db.transaction(async (trx) => {
//         const [id] = await trx("doubts").insert({
//           student_id: studentId,
//           batch_id: input.batch_id,
//           subject_id: input.subject_id,
//           assignee_id: null,
//           title: input.title,
//           status: "OPEN",
//           reopen_count: 0,
//           sla_due_at: slaDue,
//         });

//         await trx("doubt_messages").insert({
//           doubt_id: id,
//           sender_id: req.user!.id,
//           message: input.message,
//           image_path: null,
//         });

//         return id;
//       });

//       res.status(201).json({ data: { id: Number(doubtId) } });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
//       }
//       next(err);
//     }
//   },

//   async addDoubtMessage(req: Request, res: Response, next: NextFunction) {
//     try {
//       const doubtId = Number(req.params.id);
//       const input = addDoubtMessageSchema.parse(req.body);

//       const doubt = await db("doubts").where({ id: doubtId }).first();
//       if (!doubt) {
//         throw new AppError(404, "NOT_FOUND", "Doubt not found");
//       }

//       const role = req.user?.role;
//       const isFacultyOrAdmin = role === "teacher" || role === "admin";

//       await db.transaction(async (trx) => {
//         await trx("doubt_messages").insert({
//           doubt_id: doubtId,
//           sender_id: req.user!.id,
//           message: input.message,
//           image_path: null,
//         });

//         const patch: Record<string, unknown> = {};
//         if (input.resolve) {
//           patch.status = "RESOLVED";
//         } else if (isFacultyOrAdmin) {
//           patch.status = "ANSWERED";
//           patch.assignee_id = req.user!.id;
//         } else if (doubt.status === "RESOLVED" || doubt.status === "AUTO_CLOSED") {
//           patch.status = "OPEN";
//           patch.reopen_count = Number(doubt.reopen_count || 0) + 1;
//         }

//         if (Object.keys(patch).length > 0) {
//           await trx("doubts").where({ id: doubtId }).update(patch);
//         }
//       });

//       res.status(201).json({ message: "Reply posted" });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
//       }
//       next(err);
//     }
//   },

//   async updateDoubtStatus(req: Request, res: Response, next: NextFunction) {
//     try {
//       const doubtId = Number(req.params.id);
//       const input = updateDoubtStatusSchema.parse(req.body);

//       const doubt = await db("doubts").where({ id: doubtId }).first();
//       if (!doubt) {
//         throw new AppError(404, "NOT_FOUND", "Doubt not found");
//       }

//       const patch: Record<string, unknown> = { status: input.status };
//       if ((req.user?.role === "teacher" || req.user?.role === "admin") && !doubt.assignee_id) {
//         patch.assignee_id = req.user.id;
//       }

//       await db("doubts").where({ id: doubtId }).update(patch);
//       res.json({ data: { id: doubtId, status: input.status } });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
//       }
//       next(err);
//     }
//   },

//   async listExams(_req: Request, res: Response, next: NextFunction) {
//     try {
//       const rows = await db("exams as e")
//         .leftJoin("batches as b", "e.batch_id", "b.id")
//         .leftJoin("subjects as sub", "e.subject_id", "sub.id")
//         .leftJoin("marks as m", "e.id", "m.exam_id")
//         .groupBy("e.id", "e.name", "e.batch_id", "b.name", "e.subject_id", "sub.name", "e.max_marks", "e.date")
//         .select(
//           "e.id",
//           "e.name",
//           "e.batch_id",
//           "b.name as batch_name",
//           "e.subject_id",
//           "sub.name as subject_name",
//           "e.max_marks",
//           "e.date",
//           db.raw("COUNT(m.id) as graded_count"),
//           db.raw("AVG(m.score) as avg_score")
//         )
//         .orderBy("e.date", "desc")
//         .orderBy("e.id", "desc");

//       const markRows = await db("marks as m")
//         .leftJoin("students as s", "m.student_id", "s.id")
//         .leftJoin("users as u", "s.user_id", "u.id")
//         .select(
//           "m.id",
//           "m.exam_id",
//           "m.student_id",
//           "u.name as student_name",
//           "u.admission_no",
//           "m.score"
//         );

//       const marksByExam = new Map<number, typeof markRows>();
//       for (const mr of markRows) {
//         const list = marksByExam.get(Number(mr.exam_id)) || [];
//         list.push(mr);
//         marksByExam.set(Number(mr.exam_id), list);
//       }

//       res.json({
//         data: rows.map((r) => ({
//           id: Number(r.id),
//           name: r.name,
//           batch_id: Number(r.batch_id),
//           batch_name: r.batch_name || "Batch #" + r.batch_id,
//           subject_id: Number(r.subject_id),
//           subject_name: r.subject_name || "Subject #" + r.subject_id,
//           max_marks: Number(r.max_marks || 0),
//           date: fmtDate(r.date),
//           graded_count: Number(r.graded_count || 0),
//           avg_score: r.avg_score !== null && r.avg_score !== undefined ? Number(Number(r.avg_score).toFixed(1)) : null,
//           marks: (marksByExam.get(Number(r.id)) || []).map((m) => ({
//             id: Number(m.id),
//             exam_id: Number(m.exam_id),
//             student_id: Number(m.student_id),
//             student_name: m.student_name || "Student #" + m.student_id,
//             admission_no: m.admission_no || "",
//             score: Number(m.score || 0),
//           })),
//         })),
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   async createExam(req: Request, res: Response, next: NextFunction) {
//     try {
//       const input = createExamSchema.parse(req.body);
//       const [id] = await db("exams").insert({
//         name: input.name,
//         batch_id: input.batch_id,
//         subject_id: input.subject_id,
//         max_marks: input.max_marks.toFixed(2),
//         date: input.date,
//       });

//       const created = await db("exams").where({ id }).first();
//       res.status(201).json({
//         data: {
//           ...created,
//           id: Number(created?.id),
//           max_marks: Number(created?.max_marks || 0),
//           date: fmtDate(created?.date),
//         },
//       });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
//       }
//       next(err);
//     }
//   },

//   async getExamMarksSheet(req: Request, res: Response, next: NextFunction) {
//     try {
//       const examId = Number(req.params.id);
//       const exam = await db("exams").where({ id: examId }).first();
//       if (!exam) {
//         throw new AppError(404, "NOT_FOUND", "Exam not found");
//       }

//       const roster = await db("students as s")
//         .join("users as u", "s.user_id", "u.id")
//         .where("u.role", "student")
//         .select(
//           "s.id as student_id",
//           "u.admission_no",
//           "u.name as student_name",
//           "s.batch_id"
//         )
//         .orderBy("u.admission_no", "asc");

//       const existingMarks = await db("marks").where({ exam_id: examId });
//       const scoreMap = new Map<number, number>();
//       for (const m of existingMarks) {
//         scoreMap.set(Number(m.student_id), Number(m.score));
//       }

//       res.json({
//         data: {
//           exam: {
//             id: Number(exam.id),
//             name: exam.name,
//             batch_id: Number(exam.batch_id),
//             subject_id: Number(exam.subject_id),
//             max_marks: Number(exam.max_marks || 0),
//             date: fmtDate(exam.date),
//           },
//           sheet: roster.map((r) => ({
//             student_id: Number(r.student_id),
//             admission_no: r.admission_no,
//             student_name: r.student_name,
//             batch_id: r.batch_id ? Number(r.batch_id) : null,
//             score: scoreMap.has(Number(r.student_id)) ? scoreMap.get(Number(r.student_id))! : 0,
//             graded: scoreMap.has(Number(r.student_id)),
//           })),
//         },
//       });
//     } catch (err) {
//       next(err);
//     }
//   },

//   async saveExamMarks(req: Request, res: Response, next: NextFunction) {
//     try {
//       const examId = Number(req.params.id);
//       const input = saveMarksSchema.parse(req.body);

//       const exam = await db("exams").where({ id: examId }).first();
//       if (!exam) {
//         throw new AppError(404, "NOT_FOUND", "Exam not found");
//       }

//       const maxMarks = Number(exam.max_marks || 0);

//       await db.transaction(async (trx) => {
//         for (const rec of input.records) {
//           if (rec.score > maxMarks) {
//             throw new AppError(400, "INVALID_SCORE", "Score " + rec.score + " cannot exceed max marks " + maxMarks);
//           }
//           const existing = await trx("marks")
//             .where({ exam_id: examId, student_id: rec.student_id })
//             .first();

//           if (existing) {
//             await trx("marks").where({ id: existing.id }).update({ score: rec.score.toFixed(2) });
//           } else {
//             await trx("marks").insert({
//               exam_id: examId,
//               student_id: rec.student_id,
//               score: rec.score.toFixed(2),
//             });
//           }
//         }
//       });

//       res.status(201).json({
//         message: "Marks saved",
//         data: { exam_id: examId, count: input.records.length },
//       });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
//       }
//       next(err);
//     }
//   },
// };



import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { db } from "../../config/db";
import { AppError } from "../../middleware/error.middleware";
import {
  createDoubtSchema,
  addDoubtMessageSchema,
  updateDoubtStatusSchema,
  createExamSchema,
  saveMarksSchema,
} from "./learning.schema";

function fmtDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function extractId(row: unknown): number {
  if (typeof row === "object" && row !== null && "id" in row) {
    return Number((row as { id: number | string }).id);
  }
  return Number(row);
}

async function resolveStudentId(req: Request, explicitId?: number): Promise<number | null> {
  if (explicitId) return explicitId;
  if (!req.user?.id) return null;
  const studentRow = await db("students").where({ user_id: req.user.id }).first();
  if (studentRow) return Number(studentRow.id);
  const firstStudent = await db("students").orderBy("id", "asc").first();
  return firstStudent ? Number(firstStudent.id) : null;
}

export const learningController = {
  async listDoubts(_req: Request, res: Response, next: NextFunction) {
    try {
      const doubts = await db("doubts as d")
        .leftJoin("students as s", "d.student_id", "s.id")
        .leftJoin("users as su", "s.user_id", "su.id")
        .leftJoin("batches as b", "d.batch_id", "b.id")
        .leftJoin("subjects as sub", "d.subject_id", "sub.id")
        .leftJoin("users as au", "d.assignee_id", "au.id")
        .select(
          "d.id",
          "d.student_id",
          "su.name as student_name",
          "su.admission_no",
          "d.batch_id",
          "b.name as batch_name",
          "d.subject_id",
          "sub.name as subject_name",
          "d.assignee_id",
          "au.name as assignee_name",
          "d.title",
          "d.status",
          "d.reopen_count",
          "d.created_at"
        )
        .orderBy("d.id", "desc");

      const doubtIds = doubts.map((d) => Number(d.id));
      const messages =
        doubtIds.length > 0
          ? await db("doubt_messages as dm")
              .leftJoin("users as u", "dm.sender_id", "u.id")
              .whereIn("dm.doubt_id", doubtIds)
              .select(
                "dm.id",
                "dm.doubt_id",
                "dm.sender_id",
                "u.name as sender_name",
                "u.role as sender_role",
                "dm.message",
                "dm.created_at"
              )
              .orderBy("dm.id", "asc")
          : [];

      const byDoubt = new Map<number, typeof messages>();
      for (const m of messages) {
        const list = byDoubt.get(Number(m.doubt_id)) || [];
        list.push(m);
        byDoubt.set(Number(m.doubt_id), list);
      }

      res.json({
        data: doubts.map((d) => ({
          id: Number(d.id),
          student_id: Number(d.student_id),
          student_name: d.student_name || "Student #" + d.student_id,
          admission_no: d.admission_no || "",
          batch_id: Number(d.batch_id),
          batch_name: d.batch_name || "Batch #" + d.batch_id,
          subject_id: Number(d.subject_id),
          subject_name: d.subject_name || "Subject #" + d.subject_id,
          assignee_id: d.assignee_id ? Number(d.assignee_id) : null,
          assignee_name: d.assignee_name || null,
          title: d.title,
          status: d.status,
          reopen_count: Number(d.reopen_count || 0),
          messages: (byDoubt.get(Number(d.id)) || []).map((m) => ({
            id: Number(m.id),
            doubt_id: Number(m.doubt_id),
            sender_id: Number(m.sender_id),
            sender_name: m.sender_name || "User #" + m.sender_id,
            sender_role: m.sender_role || "student",
            message: m.message,
            created_at: m.created_at,
          })),
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  async createDoubt(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createDoubtSchema.parse(req.body);
      const studentId = await resolveStudentId(req, input.student_id);
      if (!studentId) {
        throw new AppError(400, "STUDENT_NOT_FOUND", "No student profile available for creating doubt");
      }

      const slaDue = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const doubtId = await db.transaction(async (trx) => {
        const [inserted] = await trx("doubts")
          .insert({
            student_id: studentId,
            batch_id: input.batch_id,
            subject_id: input.subject_id,
            assignee_id: null,
            title: input.title,
            status: "OPEN",
            reopen_count: 0,
            sla_due_at: slaDue,
          })
          .returning("id");

        const id = extractId(inserted);

        await trx("doubt_messages").insert({
          doubt_id: id,
          sender_id: req.user!.id,
          message: input.message,
          image_path: null,
        });

        return id;
      });

      res.status(201).json({ data: { id: Number(doubtId) } });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async addDoubtMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const doubtId = Number(req.params.id);
      const input = addDoubtMessageSchema.parse(req.body);

      const doubt = await db("doubts").where({ id: doubtId }).first();
      if (!doubt) {
        throw new AppError(404, "NOT_FOUND", "Doubt not found");
      }

      const role = req.user?.role;
      const isFacultyOrAdmin = role === "teacher" || role === "admin";

      await db.transaction(async (trx) => {
        await trx("doubt_messages").insert({
          doubt_id: doubtId,
          sender_id: req.user!.id,
          message: input.message,
          image_path: null,
        });

        const patch: Record<string, unknown> = {};
        if (input.resolve) {
          patch.status = "RESOLVED";
        } else if (isFacultyOrAdmin) {
          patch.status = "ANSWERED";
          patch.assignee_id = req.user!.id;
        } else if (doubt.status === "RESOLVED" || doubt.status === "AUTO_CLOSED") {
          patch.status = "OPEN";
          patch.reopen_count = Number(doubt.reopen_count || 0) + 1;
        }

        if (Object.keys(patch).length > 0) {
          await trx("doubts").where({ id: doubtId }).update(patch);
        }
      });

      res.status(201).json({ message: "Reply posted" });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async updateDoubtStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const doubtId = Number(req.params.id);
      const input = updateDoubtStatusSchema.parse(req.body);

      const doubt = await db("doubts").where({ id: doubtId }).first();
      if (!doubt) {
        throw new AppError(404, "NOT_FOUND", "Doubt not found");
      }

      const patch: Record<string, unknown> = { status: input.status };
      if ((req.user?.role === "teacher" || req.user?.role === "admin") && !doubt.assignee_id) {
        patch.assignee_id = req.user.id;
      }

      await db("doubts").where({ id: doubtId }).update(patch);
      res.json({ data: { id: doubtId, status: input.status } });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async listExams(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await db("exams as e")
        .leftJoin("batches as b", "e.batch_id", "b.id")
        .leftJoin("subjects as sub", "e.subject_id", "sub.id")
        .leftJoin("marks as m", "e.id", "m.exam_id")
        .groupBy("e.id", "e.name", "e.batch_id", "b.name", "e.subject_id", "sub.name", "e.max_marks", "e.date")
        .select(
          "e.id",
          "e.name",
          "e.batch_id",
          "b.name as batch_name",
          "e.subject_id",
          "sub.name as subject_name",
          "e.max_marks",
          "e.date",
          db.raw("COUNT(m.id) as graded_count"),
          db.raw("AVG(m.score) as avg_score")
        )
        .orderBy("e.date", "desc")
        .orderBy("e.id", "desc");

      const markRows = await db("marks as m")
        .leftJoin("students as s", "m.student_id", "s.id")
        .leftJoin("users as u", "s.user_id", "u.id")
        .select(
          "m.id",
          "m.exam_id",
          "m.student_id",
          "u.name as student_name",
          "u.admission_no",
          "m.score"
        );

      const marksByExam = new Map<number, typeof markRows>();
      for (const mr of markRows) {
        const list = marksByExam.get(Number(mr.exam_id)) || [];
        list.push(mr);
        marksByExam.set(Number(mr.exam_id), list);
      }

      res.json({
        data: rows.map((r) => ({
          id: Number(r.id),
          name: r.name,
          batch_id: Number(r.batch_id),
          batch_name: r.batch_name || "Batch #" + r.batch_id,
          subject_id: Number(r.subject_id),
          subject_name: r.subject_name || "Subject #" + r.subject_id,
          max_marks: Number(r.max_marks || 0),
          date: fmtDate(r.date),
          graded_count: Number(r.graded_count || 0),
          avg_score: r.avg_score !== null && r.avg_score !== undefined ? Number(Number(r.avg_score).toFixed(1)) : null,
          marks: (marksByExam.get(Number(r.id)) || []).map((m) => ({
            id: Number(m.id),
            exam_id: Number(m.exam_id),
            student_id: Number(m.student_id),
            student_name: m.student_name || "Student #" + m.student_id,
            admission_no: m.admission_no || "",
            score: Number(m.score || 0),
          })),
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  async createExam(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createExamSchema.parse(req.body);
      const [inserted] = await db("exams")
        .insert({
          name: input.name,
          batch_id: input.batch_id,
          subject_id: input.subject_id,
          max_marks: input.max_marks.toFixed(2),
          date: input.date,
        })
        .returning("id");

      const id = extractId(inserted);
      const created = await db("exams").where({ id }).first();
      res.status(201).json({
        data: {
          ...created,
          id: Number(created?.id),
          max_marks: Number(created?.max_marks || 0),
          date: fmtDate(created?.date),
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async getExamMarksSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.id);
      const exam = await db("exams").where({ id: examId }).first();
      if (!exam) {
        throw new AppError(404, "NOT_FOUND", "Exam not found");
      }

      const roster = await db("students as s")
        .join("users as u", "s.user_id", "u.id")
        .where("u.role", "student")
        .select(
          "s.id as student_id",
          "u.admission_no",
          "u.name as student_name",
          "s.batch_id"
        )
        .orderBy("u.admission_no", "asc");

      const existingMarks = await db("marks").where({ exam_id: examId });
      const scoreMap = new Map<number, number>();
      for (const m of existingMarks) {
        scoreMap.set(Number(m.student_id), Number(m.score));
      }

      res.json({
        data: {
          exam: {
            id: Number(exam.id),
            name: exam.name,
            batch_id: Number(exam.batch_id),
            subject_id: Number(exam.subject_id),
            max_marks: Number(exam.max_marks || 0),
            date: fmtDate(exam.date),
          },
          sheet: roster.map((r) => ({
            student_id: Number(r.student_id),
            admission_no: r.admission_no,
            student_name: r.student_name,
            batch_id: r.batch_id ? Number(r.batch_id) : null,
            score: scoreMap.has(Number(r.student_id)) ? scoreMap.get(Number(r.student_id))! : 0,
            graded: scoreMap.has(Number(r.student_id)),
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async saveExamMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.id);
      const input = saveMarksSchema.parse(req.body);

      const exam = await db("exams").where({ id: examId }).first();
      if (!exam) {
        throw new AppError(404, "NOT_FOUND", "Exam not found");
      }

      const maxMarks = Number(exam.max_marks || 0);

      await db.transaction(async (trx) => {
        for (const rec of input.records) {
          if (rec.score > maxMarks) {
            throw new AppError(400, "INVALID_SCORE", "Score " + rec.score + " cannot exceed max marks " + maxMarks);
          }
          const existing = await trx("marks")
            .where({ exam_id: examId, student_id: rec.student_id })
            .first();

          if (existing) {
            await trx("marks").where({ id: existing.id }).update({ score: rec.score.toFixed(2) });
          } else {
            await trx("marks").insert({
              exam_id: examId,
              student_id: rec.student_id,
              score: rec.score.toFixed(2),
            });
          }
        }
      });

      res.status(201).json({
        message: "Marks saved",
        data: { exam_id: examId, count: input.records.length },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },
};