import express from "express";
import { getPreferences, updatePreferences } from "../controllers/preferences.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/preferences/payment-days", authMiddleware, getPreferences);
router.patch("/preferences/payment-days", authMiddleware, updatePreferences);

export default router;