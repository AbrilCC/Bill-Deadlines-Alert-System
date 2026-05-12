import express from "express";
import { getMonthlySummary } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard/monthly-summary", authMiddleware, getMonthlySummary);

export default router;