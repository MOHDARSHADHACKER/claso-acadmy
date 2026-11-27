// import { Request, Response, NextFunction } from "express";
// import { ZodError } from "zod";
// import bcrypt from "bcrypt";
// import { db } from "../../config/db";
// import { AppError } from "../../middleware/error.middleware";
// import {
//   createTeacherSchema,
//   toggleTeacherStatusSchema,
//   createStudentSchema,
//   updateStudentSchema,
// } from "./people.schema";

// export const peopleController = {
//   async listTeachers(_req: Request, res: Response, next: NextFunction) {
//     try {
//       const teachers = await db("users as u")
//         .leftJoin("timetable as t", "u.id", "t.teacher_id")
//         .where("u.role", "teacher")
//         .groupBy("u.id", "u.name", "u.email", "u.phone", "u.is_active", "u.created_at")
//         .select(
//           "u.id",
//           "u.name",
//           "u.email",
//           "u.phone",
//           "u.is_active",
//           "u.created_at",
//           db.raw("COUNT(DISTINCT t.id) as slot_count"),
//           db.raw("COUNT(DISTINCT t.batch_id) as batch_count")
//         )
//         .orderBy("u.id", "asc");

//       res.json({
//         data: teachers.map((row) => ({
//           ...row,
//           is_active: Boolean(row.is_active),
//           slot_count: Number(row.slot_count || 0),
//           batch_count: Number(row.batch_count || 0),
//         })),
//       });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },

//   async createTeacher(req: Request, res: Response, next: NextFunction) {
//     try {
//       const input = createTeacherSchema.parse(req.body);
//       const existing = await db("users").where({ email: input.email }).first();
//       if (existing) {
//         throw new AppError(409, "DUPLICATE_EMAIL", "A user with this email already exists");
//       }

//       const rawPassword = input.password && input.password.trim().length >= 6 ? input.password.trim() : "Claso@123";
//       const password_hash = await bcrypt.hash(rawPassword, 12);

//       const [userId] = await db("users").insert({
//         name: input.name,
//         email: input.email,
//         phone: input.phone ? input.phone : null,
//         role: "teacher",
//         password_hash,
//         is_active: true,
//         must_change_pw: true,
//       });

//       const created = await db("users")
//         .where({ id: userId })
//         .select("id", "name", "email", "phone", "is_active", "created_at")
//         .first();

//       res.status(201).json({
//         data: { ...created, is_active: Boolean(created?.is_active), slot_count: 0, batch_count: 0 },
//       });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },

//   async toggleTeacherStatus(req: Request, res: Response, next: NextFunction) {
//     try {
//       const id = Number(req.params.id);
//       const { is_active } = toggleTeacherStatusSchema.parse(req.body);
//       const teacher = await db("users").where({ id, role: "teacher" }).first();
//       if (!teacher) {
//         throw new AppError(404, "NOT_FOUND", "Teacher not found");
//       }

//       await db("users").where({ id }).update({ is_active });
//       const updated = await db("users")
//         .where({ id })
//         .select("id", "name", "email", "phone", "is_active", "created_at")
//         .first();

//       res.json({ data: { ...updated, is_active: Boolean(updated?.is_active) } });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },

//   async listStudents(_req: Request, res: Response, next: NextFunction) {
//     try {
//       const rows = await db("students as s")
//         .join("users as u", "s.user_id", "u.id")
//         .leftJoin("batches as b", "s.batch_id", "b.id")
//         .where("u.role", "student")
//         .select(
//           "s.id",
//           "s.user_id",
//           "u.admission_no",
//           "u.name",
//           "u.email",
//           "u.phone",
//           "u.is_active",
//           "s.batch_id",
//           "b.name as batch_name",
//           "s.guardian_name",
//           "s.guardian_phone",
//           "s.address",
//           "s.status",
//           "s.created_at"
//         )
//         .orderBy("s.id", "desc");

//       res.json({ data: rows });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },

//   async createStudent(req: Request, res: Response, next: NextFunction) {
//     try {
//       const input = createStudentSchema.parse(req.body);
//       const existingAdm = await db("users").where({ admission_no: input.admission_no }).first();
//       if (existingAdm) {
//         throw new AppError(409, "DUPLICATE_ADMISSION", "Admission number already exists");
//       }

//       const rawPassword = input.password && input.password.trim().length >= 6 ? input.password.trim() : "Claso@123";
//       const password_hash = await bcrypt.hash(rawPassword, 12);

//       const createdId = await db.transaction(async (trx) => {
//         const [userId] = await trx("users").insert({
//           admission_no: input.admission_no,
//           name: input.name,
//           email: input.email ? input.email : null,
//           phone: input.phone ? input.phone : null,
//           role: "student",
//           password_hash,
//           is_active: true,
//           must_change_pw: true,
//         });

//         const [studentId] = await trx("students").insert({
//           user_id: userId,
//           batch_id: input.batch_id ?? null,
//           guardian_name: input.guardian_name ? input.guardian_name : null,
//           guardian_phone: input.guardian_phone ? input.guardian_phone : null,
//           address: input.address ? input.address : null,
//           status: "active",
//         });

//         return studentId;
//       });

//       const created = await db("students as s")
//         .join("users as u", "s.user_id", "u.id")
//         .leftJoin("batches as b", "s.batch_id", "b.id")
//         .where("s.id", createdId)
//         .select(
//           "s.id",
//           "s.user_id",
//           "u.admission_no",
//           "u.name",
//           "u.email",
//           "u.phone",
//           "u.is_active",
//           "s.batch_id",
//           "b.name as batch_name",
//           "s.guardian_name",
//           "s.guardian_phone",
//           "s.address",
//           "s.status",
//           "s.created_at"
//         )
//         .first();

//       res.status(201).json({ data: created });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },

//   async updateStudent(req: Request, res: Response, next: NextFunction) {
//     try {
//       const id = Number(req.params.id);
//       const input = updateStudentSchema.parse(req.body);
//       const student = await db("students").where({ id }).first();
//       if (!student) {
//         throw new AppError(404, "NOT_FOUND", "Student record not found");
//       }

//       const patch: Record<string, unknown> = {};
//       if (input.batch_id !== undefined) patch.batch_id = input.batch_id;
//       if (input.status !== undefined) patch.status = input.status;

//       await db.transaction(async (trx) => {
//         if (Object.keys(patch).length > 0) {
//           await trx("students").where({ id }).update(patch);
//         }
//         if (input.status !== undefined) {
//           await trx("users").where({ id: student.user_id }).update({ is_active: input.status === "active" });
//         }
//       });

//       const updated = await db("students as s")
//         .join("users as u", "s.user_id", "u.id")
//         .leftJoin("batches as b", "s.batch_id", "b.id")
//         .where("s.id", id)
//         .select(
//           "s.id",
//           "s.user_id",
//           "u.admission_no",
//           "u.name",
//           "u.email",
//           "u.phone",
//           "u.is_active",
//           "s.batch_id",
//           "b.name as batch_name",
//           "s.guardian_name",
//           "s.guardian_phone",
//           "s.address",
//           "s.status",
//           "s.created_at"
//         )
//         .first();

//       res.json({ data: updated });
//     } catch (err) {
//       if (err instanceof ZodError) {
//         const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
//         return next(new AppError(400, "VALIDATION_ERROR", msg));
//       }
//       next(err);
//     }
//   },
// };


import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import bcrypt from "bcrypt";
import { db } from "../../config/db";
import { AppError } from "../../middleware/error.middleware";
import {
  createTeacherSchema,
  toggleTeacherStatusSchema,
  createStudentSchema,
  updateStudentSchema,
} from "./people.schema";

export const peopleController = {
  async listTeachers(_req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await db("users as u")
        .leftJoin("timetable as t", "u.id", "t.teacher_id")
        .where("u.role", "teacher")
        .groupBy("u.id", "u.name", "u.email", "u.phone", "u.is_active", "u.created_at")
        .select(
          "u.id",
          "u.name",
          "u.email",
          "u.phone",
          "u.is_active",
          "u.created_at",
          db.raw("COUNT(DISTINCT t.id) as slot_count"),
          db.raw("COUNT(DISTINCT t.batch_id) as batch_count")
        )
        .orderBy("u.id", "asc");

      res.json({
        data: teachers.map((row) => ({
          ...row,
          is_active: Boolean(row.is_active),
          slot_count: Number(row.slot_count || 0),
          batch_count: Number(row.batch_count || 0),
        })),
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async createTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTeacherSchema.parse(req.body);
      const existing = await db("users").where({ email: input.email }).first();
      if (existing) {
        throw new AppError(409, "DUPLICATE_EMAIL", "A user with this email already exists");
      }

      const rawPassword = input.password && input.password.trim().length >= 6 ? input.password.trim() : "Claso@123";
      const password_hash = await bcrypt.hash(rawPassword, 12);

      const [insertedUser] = await db("users")
        .insert({
          name: input.name,
          email: input.email,
          phone: input.phone ? input.phone : null,
          role: "teacher",
          password_hash,
          is_active: true,
          must_change_pw: true,
        })
        .returning("id");

      const userId =
        typeof insertedUser === "object" && insertedUser !== null
          ? insertedUser.id
          : insertedUser;

      const created = await db("users")
        .where({ id: userId })
        .select("id", "name", "email", "phone", "is_active", "created_at")
        .first();

      res.status(201).json({
        data: { ...created, is_active: Boolean(created?.is_active), slot_count: 0, batch_count: 0 },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async toggleTeacherStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { is_active } = toggleTeacherStatusSchema.parse(req.body);
      const teacher = await db("users").where({ id, role: "teacher" }).first();
      if (!teacher) {
        throw new AppError(404, "NOT_FOUND", "Teacher not found");
      }

      await db("users").where({ id }).update({ is_active });
      const updated = await db("users")
        .where({ id })
        .select("id", "name", "email", "phone", "is_active", "created_at")
        .first();

      res.json({ data: { ...updated, is_active: Boolean(updated?.is_active) } });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async listStudents(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await db("students as s")
        .join("users as u", "s.user_id", "u.id")
        .leftJoin("batches as b", "s.batch_id", "b.id")
        .where("u.role", "student")
        .select(
          "s.id",
          "s.user_id",
          "u.admission_no",
          "u.name",
          "u.email",
          "u.phone",
          "u.is_active",
          "s.batch_id",
          "b.name as batch_name",
          "s.guardian_name",
          "s.guardian_phone",
          "s.address",
          "s.status",
          "s.created_at"
        )
        .orderBy("s.id", "desc");

      res.json({ data: rows });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createStudentSchema.parse(req.body);
      const existingAdm = await db("users").where({ admission_no: input.admission_no }).first();
      if (existingAdm) {
        throw new AppError(409, "DUPLICATE_ADMISSION", "Admission number already exists");
      }

      const rawPassword = input.password && input.password.trim().length >= 6 ? input.password.trim() : "Claso@123";
      const password_hash = await bcrypt.hash(rawPassword, 12);

      const createdId = await db.transaction(async (trx) => {
        const [insertedUser] = await trx("users")
          .insert({
            admission_no: input.admission_no,
            name: input.name,
            email: input.email ? input.email : null,
            phone: input.phone ? input.phone : null,
            role: "student",
            password_hash,
            is_active: true,
            must_change_pw: true,
          })
          .returning("id");

        const userId =
          typeof insertedUser === "object" && insertedUser !== null
            ? insertedUser.id
            : insertedUser;

        const [insertedStudent] = await trx("students")
          .insert({
            user_id: userId,
            batch_id: input.batch_id ?? null,
            guardian_name: input.guardian_name?.trim() ? input.guardian_name.trim() : "Guardian",
            guardian_phone: input.guardian_phone?.trim() ? input.guardian_phone.trim() : null,
            address: input.address?.trim() ? input.address.trim() : null,
            status: "active",
          })
          .returning("id");

        const studentId =
          typeof insertedStudent === "object" && insertedStudent !== null
            ? insertedStudent.id
            : insertedStudent;

        return studentId;
      });

      const created = await db("students as s")
        .join("users as u", "s.user_id", "u.id")
        .leftJoin("batches as b", "s.batch_id", "b.id")
        .where("s.id", createdId)
        .select(
          "s.id",
          "s.user_id",
          "u.admission_no",
          "u.name",
          "u.email",
          "u.phone",
          "u.is_active",
          "s.batch_id",
          "b.name as batch_name",
          "s.guardian_name",
          "s.guardian_phone",
          "s.address",
          "s.status",
          "s.created_at"
        )
        .first();

      res.status(201).json({ data: created });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const input = updateStudentSchema.parse(req.body);
      const student = await db("students").where({ id }).first();
      if (!student) {
        throw new AppError(404, "NOT_FOUND", "Student record not found");
      }

      const patch: Record<string, unknown> = {};
      if (input.batch_id !== undefined) patch.batch_id = input.batch_id;
      if (input.status !== undefined) patch.status = input.status;

      await db.transaction(async (trx) => {
        if (Object.keys(patch).length > 0) {
          await trx("students").where({ id }).update(patch);
        }
        if (input.status !== undefined) {
          await trx("users").where({ id: student.user_id }).update({ is_active: input.status === "active" });
        }
      });

      const updated = await db("students as s")
        .join("users as u", "s.user_id", "u.id")
        .leftJoin("batches as b", "s.batch_id", "b.id")
        .where("s.id", id)
        .select(
          "s.id",
          "s.user_id",
          "u.admission_no",
          "u.name",
          "u.email",
          "u.phone",
          "u.is_active",
          "s.batch_id",
          "b.name as batch_name",
          "s.guardian_name",
          "s.guardian_phone",
          "s.address",
          "s.status",
          "s.created_at"
        )
        .first();

      res.json({ data: updated });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join(", ") || "Invalid input";
        return next(new AppError(400, "VALIDATION_ERROR", msg));
      }
      next(err);
    }
  },
};