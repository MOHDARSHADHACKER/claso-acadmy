import { z } from "zod";

export const markAttendanceSchema = z.object({
  batch_id: z.coerce.number().int().positive("Batch is required"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  records: z
    .array(
      z.object({
        student_id: z.coerce.number().int().positive(),
        status: z.enum(["present", "absent", "late"]),
      })
    )
    .min(1, "At least one student attendance record is required"),
});
