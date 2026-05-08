import express from "express";
import { getMonthlySummary } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/dashboard/monthly-summary", getMonthlySummary);

export default router;