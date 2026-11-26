import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { feesController } from "./fees.controller";

const router = Router();

router.use(requireAuth);

router.get("/plans", feesController.listPlans);
router.post("/plans", requireRole("admin"), feesController.createPlan);

router.get("/invoices", feesController.listInvoices);
router.post("/invoices", requireRole("admin"), feesController.createInvoice);
router.post("/invoices/:id/payments", requireRole("admin"), feesController.recordPayment);

export default router;
