import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const toggleTeacherStatusSchema = z.object({
  is_active: z.boolean(),
});

export const createStudentSchema = z.object({
  admission_no: z.string().trim().min(3, "Admission number is required"),
  name: z.string().trim().min(2, "Student name is required"),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  batch_id: z.coerce.number().int().positive().nullable().optional(),
  guardian_name: z.string().trim().optional().or(z.literal("")),
  guardian_phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
});

export const updateStudentSchema = z.object({
  batch_id: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
