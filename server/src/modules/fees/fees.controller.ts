import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { db } from "../../config/db";
import { AppError } from "../../middleware/error.middleware";
import { createFeePlanSchema, createInvoiceSchema, recordPaymentSchema } from "./fees.schema";

function formatDateOnly(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

export const feesController = {
  async listPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await db("fee_plans").select("*").orderBy("id", "asc");
      res.json({
        data: plans.map((p) => ({
          ...p,
          total_amount: Number(p.total_amount || 0),
          installments: Number(p.installments || 1),
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createFeePlanSchema.parse(req.body);
      const [id] = await db("fee_plans").insert({
        name: input.name,
        total_amount: input.total_amount.toFixed(2),
        installments: input.installments,
      });
      const created = await db("fee_plans").where({ id }).first();
      res.status(201).json({
        data: {
          ...created,
          total_amount: Number(created?.total_amount || 0),
          installments: Number(created?.installments || 1),
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const studentIdParam = req.query.studentId ? Number(req.query.studentId) : undefined;
      let baseQuery = db("invoices as inv")
        .leftJoin("students as s", "inv.student_id", "s.id")
        .leftJoin("users as u", "s.user_id", "u.id")
        .leftJoin("payments as pay", "inv.id", "pay.invoice_id")
        .groupBy(
          "inv.id",
          "inv.student_id",
          "inv.title",
          "inv.amount",
          "inv.due_date",
          "inv.status",
          "u.name",
          "u.admission_no"
        )
        .select(
          "inv.id",
          "inv.student_id",
          "u.name as student_name",
          "u.admission_no",
          "inv.title",
          "inv.amount",
          "inv.due_date",
          "inv.status",
          db.raw("COALESCE(SUM(pay.amount), 0) as paid_amount")
        )
        .orderBy("inv.id", "desc");

      if (studentIdParam) {
        baseQuery = baseQuery.where("inv.student_id", studentIdParam);
      }

      const rows = await baseQuery;
      const todayStr = new Date().toISOString().slice(0, 10);

      const invoices = rows.map((r) => {
        const amount = Number(r.amount || 0);
        const paid = Number(r.paid_amount || 0);
        const balance = Math.max(0, Number((amount - paid).toFixed(2)));
        const dueStr = formatDateOnly(r.due_date);

        let effectiveStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = r.status;
        if (paid >= amount && amount > 0) {
          effectiveStatus = "PAID";
        } else if (paid > 0 && paid < amount) {
          effectiveStatus = "PARTIAL";
        } else if (dueStr && dueStr < todayStr && r.status !== "PAID") {
          effectiveStatus = "OVERDUE";
        }

        return {
          id: Number(r.id),
          student_id: Number(r.student_id),
          student_name: r.student_name || "Student #" + r.student_id,
          admission_no: r.admission_no || "",
          title: r.title,
          amount,
          paid_amount: paid,
          balance_due: balance,
          due_date: dueStr,
          status: effectiveStatus,
        };
      });

      res.json({ data: invoices });
    } catch (err) {
      next(err);
    }
  },

  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createInvoiceSchema.parse(req.body);
      const student = await db("students").where({ id: input.student_id }).first();
      if (!student) {
        throw new AppError(404, "NOT_FOUND", "Student not found");
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const initialStatus = input.due_date < todayStr ? "OVERDUE" : "PENDING";

      const [id] = await db("invoices").insert({
        student_id: input.student_id,
        title: input.title,
        amount: input.amount.toFixed(2),
        due_date: input.due_date,
        status: initialStatus,
      });

      const created = await db("invoices as inv")
        .leftJoin("students as s", "inv.student_id", "s.id")
        .leftJoin("users as u", "s.user_id", "u.id")
        .where("inv.id", id)
        .select(
          "inv.id",
          "inv.student_id",
          "u.name as student_name",
          "u.admission_no",
          "inv.title",
          "inv.amount",
          "inv.due_date",
          "inv.status"
        )
        .first();

      const amt = Number(created?.amount || 0);
      res.status(201).json({
        data: {
          ...created,
          id: Number(created?.id),
          student_id: Number(created?.student_id),
          amount: amt,
          paid_amount: 0,
          balance_due: amt,
          due_date: formatDateOnly(created?.due_date),
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = Number(req.params.id);
      const input = recordPaymentSchema.parse(req.body);

      const invoice = await db("invoices").where({ id: invoiceId }).first();
      if (!invoice) {
        throw new AppError(404, "NOT_FOUND", "Invoice not found");
      }

      const paidOnStr = input.paid_on || new Date().toISOString().slice(0, 10);
      const recorderId = req.user?.id ?? null;

      const result = await db.transaction(async (trx) => {
        const [paymentId] = await trx("payments").insert({
          invoice_id: invoiceId,
          amount: input.amount.toFixed(2),
          mode: input.mode,
          reference: input.reference ? input.reference : null,
          paid_on: paidOnStr,
          recorded_by: recorderId,
        });

        const sumRow = await trx("payments")
          .where({ invoice_id: invoiceId })
          .sum("amount as totalPaid")
          .first();

        const totalPaid = Number(sumRow?.totalPaid || 0);
        const invAmount = Number(invoice.amount || 0);
        const dueStr = formatDateOnly(invoice.due_date);
        const todayStr = new Date().toISOString().slice(0, 10);

        let nextStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = "PENDING";
        if (totalPaid >= invAmount && invAmount > 0) {
          nextStatus = "PAID";
        } else if (totalPaid > 0 && totalPaid < invAmount) {
          nextStatus = "PARTIAL";
        } else if (dueStr && dueStr < todayStr) {
          nextStatus = "OVERDUE";
        }

        await trx("invoices").where({ id: invoiceId }).update({ status: nextStatus });

        return {
          paymentId,
          totalPaid,
          balanceDue: Math.max(0, Number((invAmount - totalPaid).toFixed(2))),
          status: nextStatus,
        };
      });

      res.status(201).json({
        message: "Payment recorded",
        data: result,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new AppError(400, "VALIDATION_ERROR", err.issues.map((i) => i.message).join(", ")));
      }
      next(err);
    }
  },
};
