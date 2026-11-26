import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createBatchSchema = z.object({
  course_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  timings: z.string().trim().min(2).max(100),
  is_active: z.boolean().optional(),
});

export const updateBatchSchema = createBatchSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(30).optional().nullable(),
});

export const assignBatchSubjectSchema = z.object({
  batch_id: z.coerce.number().int().positive(),
  subject_id: z.coerce.number().int().positive(),
  teacher_id: z.coerce.number().int().positive().nullable().optional(),
});

export const createTimetableSlotSchema = z.object({
  batch_id: z.coerce.number().int().positive(),
  subject_id: z.coerce.number().int().positive(),
  teacher_id: z.coerce.number().int().positive(),
  weekday: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  start_time: z.string().trim().min(3).max(10),
  end_time: z.string().trim().min(3).max(10),
});

export const updateTimetableSlotSchema = createTimetableSlotSchema.partial();
