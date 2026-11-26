import { z } from "zod";

export const createDoubtSchema = z.object({
  title: z.string().trim().min(3, "Doubt title is required"),
  batch_id: z.coerce.number().int().positive("Batch is required"),
  subject_id: z.coerce.number().int().positive("Subject is required"),
  message: z.string().trim().min(2, "Question description is required"),
  student_id: z.coerce.number().int().positive().optional(),
});

export const addDoubtMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
  resolve: z.boolean().optional(),
});

export const updateDoubtStatusSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "ANSWERED", "RESOLVED", "AUTO_CLOSED"]),
});

export const createExamSchema = z.object({
  name: z.string().trim().min(2, "Exam name is required"),
  batch_id: z.coerce.number().int().positive("Batch is required"),
  subject_id: z.coerce.number().int().positive("Subject is required"),
  max_marks: z.coerce.number().positive("Max marks must be greater than 0"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const saveMarksSchema = z.object({
  records: z
    .array(
      z.object({
        student_id: z.coerce.number().int().positive(),
        score: z.coerce.number().min(0, "Score cannot be negative"),
      })
    )
    .min(1, "At least one mark entry is required"),
});
