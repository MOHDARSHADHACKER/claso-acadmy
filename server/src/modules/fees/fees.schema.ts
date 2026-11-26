import { z } from "zod";

export const createFeePlanSchema = z.object({
  name: z.string().trim().min(2, "Plan name is required"),
  total_amount: z.coerce.number().positive("Total amount must be greater than 0"),
  installments: z.coerce.number().int().min(1).max(24).default(1),
});

export const createInvoiceSchema = z.object({
  student_id: z.coerce.number().int().positive("Student is required"),
  title: z.string().trim().min(2, "Invoice title is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  due_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD"),
});

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  mode: z.enum(["cash", "upi", "bank", "cheque"]),
  reference: z.string().trim().optional().or(z.literal("")),
  paid_on: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Paid date must be YYYY-MM-DD")
    .optional(),
});
