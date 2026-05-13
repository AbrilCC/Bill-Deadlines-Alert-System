import express from "express";
import { getMonthlySummary, getSenders, patchSenders } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard/monthly-summary", authMiddleware, getMonthlySummary);
router.get("/dashboard/senders", authMiddleware, getSenders);
router.patch("/dashboard/senders", authMiddleware, patchSenders);

export default router;