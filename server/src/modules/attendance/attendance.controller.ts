import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { db } from "../../config/db";
import { AppError } from "../../middleware/error.middleware";
import { markAttendanceSchema } from "./attendance.schema";

export const attendanceController = {
  async getBatchAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const dateStr = typeof req.query.date === "string" && req.query.date.trim()
        ? req.query.date.trim()
        : new Date().toISOString().slice(0, 10);

      let rosterQuery = db("students as s")
        .join("users as u", "s.user_id", "u.id")
        .leftJoin("batches as b", "s.batch_id", "b.id")
        .where("u.role", "student")
        .select(
          "s.id as student_id",
          "s.user_id",
          "u.admission_no",
          "u.name as student_name",
          "s.batch_id",
          "b.name as batch_name",
          "s.status as student_status"
        )
        .orderBy("u.admission_no", "asc");

      if (batchId) {
        rosterQuery = rosterQuery.where("s.batch_id", batchId);
      }

      const roster = await rosterQuery;

      let attQuery = db("attendance as a")
        .leftJoin("students as s", "a.student_id", "s.id")
        .leftJoin("users as u", "s.user_id", "u.id")
        .leftJoin("batches as b", "a.batch_id", "b.id")
        .where("a.date", dateStr)
        .select(
          "a.id",
          "a.batch_id",
          "b.name as batch_name",
          "a.student_id",
          "u.admission_no",
          "u.name as student_name",
          "a.date",
          "a.status",
          "a.marked_by"
        )
        .orderBy("a.id", "desc");

      if (batchId) {
        attQuery = attQuery.where("a.batch_id", batchId);
      }

      const existingRows = await attQuery;
      const statusByStudent = new Map<number, "present" | "absent" | "late">();
      for (const r of existingRows) {
        statusByStudent.set(Number(r.student_id), r.status);
      }

      const sheet = roster.map((item) => ({
        student_id: Number(item.student_id),
        user_id: Number(item.user_id),
        admission_no: item.admission_no,
        student_name: item.student_name,
        batch_id: item.batch_id ? Number(item.batch_id) : null,
        batch_name: item.batch_name || null,
        student_status: item.student_status,
        date: dateStr,
        status: statusByStudent.get(Number(item.student_id)) || "present",
        recorded: statusByStudent.has(Number(item.student_id)),
      }));

      res.json({
        data: {
          date: dateStr,
          batchId: batchId ?? null,
          sheet,
          records: existingRows,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const input = markAttendanceSchema.parse(req.body);
      const batch = await db("batches").where({ id: input.batch_id }).first();
      if (!batch) {
        throw new AppError(404, "NOT_FOUND", "Batch not found");
      }

      const actorId = req.user?.id ?? null;

      await db.transaction(async (trx) => {
        for (const rec of input.records) {
          const existing = await trx("attendance")
            .where({
              batch_id: input.batch_id,
              student_id: rec.student_id,
              date: input.date,
            })
            .first();

          if (existing) {
            await trx("attendance")
              .where({ id: existing.id })
              .update({
                status: rec.status,
                marked_by: actorId,
              });
          } else {
            await trx("attendance").insert({
              batch_id: input.batch_id,
              student_id: rec.student_id,
              date: input.date,
              status: rec.status,
              marked_by: actorId,
            });
          }
        }
      });

      res.status(201).json({
        message: "Attendance saved",
        data: {
          batch_id: input.batch_id,
          date: input.date,
          count: input.records.length,
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid attendance payload";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      let query = db("attendance as a")
        .leftJoin("batches as b", "a.batch_id", "b.id")
        .groupBy("a.batch_id", "b.name")
        .select(
          "a.batch_id",
          "b.name as batch_name",
          db.raw("COUNT(*) as total_count"),
          db.raw("SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count"),
          db.raw("SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count"),
          db.raw("SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count")
        );

      if (batchId) {
        query = query.where("a.batch_id", batchId);
      }

      const rows = await query;
      const summary = rows.map((r) => {
        const total = Number(r.total_count || 0);
        const present = Number(r.present_count || 0);
        const absent = Number(r.absent_count || 0);
        const late = Number(r.late_count || 0);
        const attended = present + late;
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
        return {
          batch_id: Number(r.batch_id),
          batch_name: r.batch_name || "Batch #" + r.batch_id,
          total,
          present,
          absent,
          late,
          percentage,
        };
      });

      const overallTotal = summary.reduce((acc, s) => acc + s.total, 0);
      const overallPresent = summary.reduce((acc, s) => acc + s.present, 0);
      const overallAbsent = summary.reduce((acc, s) => acc + s.absent, 0);
      const overallLate = summary.reduce((acc, s) => acc + s.late, 0);
      const overallPercentage =
        overallTotal > 0 ? Math.round(((overallPresent + overallLate) / overallTotal) * 100) : 0;

      res.json({
        data: {
          overall: {
            total: overallTotal,
            present: overallPresent,
            absent: overallAbsent,
            late: overallLate,
            percentage: overallPercentage,
          },
          byBatch: summary,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
